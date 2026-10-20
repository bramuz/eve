import { useState, useRef, useEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { toast } from 'sonner';
import { createDocument } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { RotateCcw, Save } from 'lucide-react';
import { format } from 'date-fns';

interface ConsentFormProps {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ConsentDetails {
  clientName: string;
  procedureName: string;
  professionalName: string;
  professionalCredentials: string;
  location: string;
  date: string;
  clientCedula: string;
  procedureDetails: string;
  expectedBenefits: string;
  risksAndEffects: string;
  alternatives: string;
  aftercare: string;
  questionsAndAnswers: string;
}

interface SignaturePadProps {
  label: string;
  onChange: (signature: string | null) => void;
}

const SignaturePad = ({ label, onChange }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, []);

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height)
    };
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const context = event.currentTarget.getContext('2d');
    if (!context) return;

    const point = getCanvasPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.1, point.y + 0.1);
    context.stroke();
    isDrawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    event.preventDefault();
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const point = getCanvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    onChange(event.currentTarget.toDataURL('image/png'));
  };

  const cancelDrawing = () => {
    isDrawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label} *</p>
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-2 dark:border-gray-600">
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Firma con el dedo, lápiz táctil o mouse.
        </p>
        <canvas
          ref={canvasRef}
          width={400}
          height={180}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={cancelDrawing}
          onLostPointerCapture={cancelDrawing}
          className="h-auto max-w-full touch-none cursor-crosshair rounded border border-gray-300 bg-white"
          aria-label={label}
        />
        <Button onClick={clear} variant="outline" size="sm" className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Limpiar firma
        </Button>
      </div>
    </div>
  );
};

const getConsentTemplate = ({
  clientName,
  procedureName,
  professionalName,
  professionalCredentials,
  location,
  date,
  clientCedula,
  procedureDetails,
  expectedBenefits,
  risksAndEffects,
  alternatives,
  aftercare,
  questionsAndAnswers
}: ConsentDetails) => {
  const optionalSections = [
    ['Identificación', clientCedula],
    ['Profesión o credencial del profesional', professionalCredentials],
    ['Lugar de atención', location],
    ['Descripción, técnica y zona', procedureDetails],
    ['Beneficios esperados y límites', expectedBenefits],
    ['Riesgos, efectos adversos y contraindicaciones', risksAndEffects],
    ['Alternativas, incluida la opción de no realizarlo', alternatives],
    ['Cuidados posteriores y recuperación', aftercare],
    ['Preguntas y respuestas', questionsAndAnswers]
  ].filter(([, value]) => value.trim());

  return `CONSENTIMIENTO INFORMADO PARA PROCEDIMIENTO

Persona: ${clientName}
Procedimiento: ${procedureName}
Profesional: ${professionalName}
Fecha: ${date}

DECLARACIÓN Y DECISIÓN DE LA PERSONA
Declaro que el profesional me explicó en palabras comprensibles en qué consiste el procedimiento indicado, sus beneficios esperados, los riesgos y posibles efectos no deseados relevantes para mi caso, las alternativas —incluida la opción de no realizarlo— y los cuidados posteriores. Pude hacer preguntas y recibí respuesta. Entiendo que los resultados pueden variar y que puedo decidir libremente no realizarlo. Si decido continuar, autorizo únicamente este procedimiento, según lo explicado por el profesional.

${optionalSections.length > 0 ? `INFORMACIÓN ADICIONAL REGISTRADA\n${optionalSections.map(([label, value]) => `${label}:\n${value}`).join('\n\n')}\n\n` : ''}FIRMAS
Persona: ${clientName}
Profesional que explicó el procedimiento: ${professionalName}

Este documento no autoriza el uso de fotografías con fines publicitarios ni reemplaza una autorización para tratar datos personales, la historia clínica, la valoración profesional o los requisitos específicos que correspondan. El profesional debe explicar los riesgos concretos del caso antes de solicitar la firma.`;
};

export const ConsentForm = ({ clientId, clientName, onSuccess, onCancel }: ConsentFormProps) => {
  const { currentUser } = useAuth();
  const [editClientName, setEditClientName] = useState(clientName);
  const [procedureName, setProcedureName] = useState('');
  const [professionalName, setProfessionalName] = useState(currentUser?.displayName ?? '');
  const [professionalCredentials, setProfessionalCredentials] = useState('');
  const [location, setLocation] = useState('');
  const [consentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientCedula, setClientCedula] = useState('');
  const [procedureDetails, setProcedureDetails] = useState('');
  const [expectedBenefits, setExpectedBenefits] = useState('');
  const [risksAndEffects, setRisksAndEffects] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [aftercare, setAftercare] = useState('');
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState('');
  const [professionalConfirmedInformation, setProfessionalConfirmedInformation] = useState(false);
  const [dataAuthorizationVerified, setDataAuthorizationVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientSignature, setPatientSignature] = useState<string | null>(null);
  const [professionalSignature, setProfessionalSignature] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (!editClientName.trim()) {
      toast.error('Por favor ingresa el nombre del cliente');
      return;
    }

    if (!procedureName.trim()) {
      toast.error('Por favor ingresa el nombre del procedimiento');
      return;
    }

    if (!professionalName.trim()) {
      toast.error('Por favor ingresa el nombre del profesional');
      return;
    }

    if (!professionalConfirmedInformation) {
      toast.error('Confirma que explicaste la información y respondiste las preguntas de la persona');
      return;
    }

    if (!dataAuthorizationVerified) {
      toast.error('Verifica la autorización separada para tratamiento de datos antes de continuar');
      return;
    }

    if (!patientSignature || !professionalSignature) {
      toast.error('Se requieren las firmas de la persona y del profesional');
      return;
    }

    setLoading(true);

    try {
      const consentText = getConsentTemplate({
        clientName: editClientName,
        procedureName,
        professionalName,
        professionalCredentials,
        location,
        date: consentDate,
        clientCedula,
        procedureDetails,
        expectedBenefits,
        risksAndEffects,
        alternatives,
        aftercare,
        questionsAndAnswers
      });

      const docData = {
        clientId,
        clientName: editClientName,
        procedureName,
        professionalName,
        professionalCredentials,
        location,
        consentDate,
        clientCedula,
        procedureDetails,
        expectedBenefits,
        risksAndEffects,
        alternatives,
        aftercare,
        questionsAndAnswers,
        professionalConfirmedInformation,
        dataAuthorizationVerified,
        consentText,
        signatureDataURL: patientSignature,
        professionalSignatureDataURL: professionalSignature,
        signedAt: new Date().toISOString(),
        userId: currentUser.uid,
      };

      const { error, id } = await createDocument('clientConsents', docData);

      if (error) {
        console.error('Error al guardar:', error);
        toast.error(`Error al guardar el consentimiento: ${error}`);
        return;
      }

      if (!id) {
        toast.error('No se recibió confirmación de guardado del consentimiento');
        return;
      }
      toast.success('Consentimiento guardado exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error al guardar consentimiento:', error);
      toast.error('Error al procesar el consentimiento');
    } finally {
      setLoading(false);
    }
  };

  const consentPreview = getConsentTemplate({
    clientName: editClientName || '[Nombre del cliente]',
    procedureName: procedureName || '[Nombre del procedimiento]',
    professionalName: professionalName || '[Nombre del profesional]',
    professionalCredentials,
    location,
    date: consentDate,
    clientCedula,
    procedureDetails,
    expectedBenefits,
    risksAndEffects,
    alternatives,
    aftercare,
    questionsAndAnswers
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        Completa el procedimiento y las firmas; el nombre del profesional y la fecha se precargan cuando es posible.
        Antes de firmar, explica los riesgos y cuidados específicos de este caso. Si necesitas dejar más detalles por
        escrito, puedes agregarlos abajo. Este formato no reemplaza la historia clínica ni los requisitos de tu profesión.
        La autorización para tratar datos personales se gestiona por separado.
      </div>

      {/* Client Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Cliente *
        </label>
        <Input
          type="text"
          placeholder="Nombre del cliente/paciente"
          value={editClientName}
          onChange={(e) => setEditClientName(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Procedure Name Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Procedimiento *
        </label>
        <Input
          type="text"
          placeholder="Ej: Botox, Ácido Hialurónico, Microblading..."
          value={procedureName}
          onChange={(e) => setProcedureName(e.target.value)}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Profesional *
        </label>
        <Input
          type="text"
          placeholder="Nombre de quien ofrece el servicio"
          value={professionalName}
          onChange={(e) => setProfessionalName(e.target.value)}
          className="w-full"
        />
      </div>

      <details className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <summary className="cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200">
          Agregar detalles al documento (opcional)
        </summary>
        <div className="mt-4 space-y-4">
          <Input
            label="Profesión o credencial (opcional)"
            type="text"
            placeholder="Profesión y registro, si aplica"
            value={professionalCredentials}
            onChange={(e) => setProfessionalCredentials(e.target.value)}
          />
          <Input
            label="Lugar de atención (opcional)"
            type="text"
            placeholder="Ciudad o establecimiento"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Input
            label="Identificación de la persona (opcional)"
            type="text"
            placeholder="Solo si es necesaria"
            value={clientCedula}
            onChange={(e) => setClientCedula(e.target.value)}
          />
          <Textarea
            label="Descripción, técnica y zona (opcional)"
            placeholder="Qué se realizará y en qué zona."
            value={procedureDetails}
            onChange={(e) => setProcedureDetails(e.target.value)}
          />
          <Textarea
            label="Beneficios esperados y límites (opcional)"
            placeholder="Beneficios esperados; los resultados pueden variar."
            value={expectedBenefits}
            onChange={(e) => setExpectedBenefits(e.target.value)}
          />
          <Textarea
            label="Riesgos y posibles efectos adversos (opcional)"
            placeholder="Registra los riesgos pertinentes para este caso."
            value={risksAndEffects}
            onChange={(e) => setRisksAndEffects(e.target.value)}
          />
          <Textarea
            label="Alternativas (opcional)"
            placeholder="Incluye la opción de no realizar el procedimiento."
            value={alternatives}
            onChange={(e) => setAlternatives(e.target.value)}
          />
          <Textarea
            label="Cuidados posteriores (opcional)"
            placeholder="Cuidados, señales de alerta y recuperación."
            value={aftercare}
            onChange={(e) => setAftercare(e.target.value)}
          />
          <Textarea
            label="Preguntas y respuestas (opcional)"
            placeholder="Preguntas relevantes de la persona y respuestas."
            value={questionsAndAnswers}
            onChange={(e) => setQuestionsAndAnswers(e.target.value)}
          />
        </div>
      </details>

      <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={professionalConfirmedInformation}
          onChange={(e) => setProfessionalConfirmedInformation(e.target.checked)}
          className="mt-1 h-4 w-4 accent-primary-600"
        />
        <span>
          Como profesional, confirmo que expliqué a la persona la información específica anterior, respondí
          sus preguntas, le permití decidir libremente y le entregué o puse a su disposición una copia antes
          de solicitar su firma. No marques esta casilla si esos pasos no ocurrieron.
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={dataAuthorizationVerified}
          onChange={(e) => setDataAuthorizationVerified(e.target.checked)}
          className="mt-1 h-4 w-4 accent-primary-600"
        />
        <span>
          Confirmo que antes de guardar este documento verifiqué por separado la autorización o base legal
          aplicable para tratar y almacenar la firma y los datos personales —incluidos datos sensibles, si
          aplica— en Stetik. Esta confirmación profesional no es la autorización del paciente ni la reemplaza.
        </span>
      </label>

      {/* Consent Preview */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
          VISTA PREVIA DEL CONSENTIMIENTO:
        </p>
        <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
          {consentPreview}
        </div>
      </div>

      <SignaturePad label="Firma de la persona que recibe el procedimiento" onChange={setPatientSignature} />
      <SignaturePad label="Firma del profesional que explicó el procedimiento" onChange={setProfessionalSignature} />

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            loading
            || !patientSignature
            || !professionalSignature
            || !editClientName.trim()
            || !procedureName.trim()
            || !professionalName.trim()
            || !professionalConfirmedInformation
            || !dataAuthorizationVerified
          }
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Consentimiento'}
        </Button>
      </div>
    </div>
  );
};
