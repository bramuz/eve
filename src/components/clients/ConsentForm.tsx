import { useState, useRef, useEffect } from 'react';
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
  date: string;
  clientCedula: string;
  procedureDetails: string;
  expectedBenefits: string;
  risksAndEffects: string;
  alternatives: string;
  aftercare: string;
}

const getConsentTemplate = ({
  clientName,
  procedureName,
  professionalName,
  date,
  clientCedula,
  procedureDetails,
  expectedBenefits,
  risksAndEffects,
  alternatives,
  aftercare
}: ConsentDetails) => `CONSENTIMIENTO INFORMADO PARA PROCEDIMIENTO

Yo, ${clientName || '___________________'}${clientCedula ? `, identificado(a) con ${clientCedula}` : ''}, declaro que el profesional ${professionalName || '_______________________________'} me explicó el procedimiento ${procedureName || '___________________'}.

DESCRIPCIÓN, TÉCNICA Y ZONA:
${procedureDetails || '[Completar con la descripción específica del procedimiento]'}

BENEFICIOS ESPERADOS:
${expectedBenefits || '[Completar beneficios esperados y límites del resultado]'}

RIESGOS, EFECTOS ADVERSOS Y CONTRAINDICACIONES:
${risksAndEffects || '[Completar los riesgos específicos de este procedimiento]'}

ALTERNATIVAS, INCLUIDA LA OPCIÓN DE NO REALIZAR EL PROCEDIMIENTO:
${alternatives || '[Completar las alternativas disponibles]'}

CUIDADOS POSTERIORES Y RECUPERACIÓN:
${aftercare || '[Completar instrucciones y tiempo estimado de recuperación]'}

AUTORIZACIÓN:
Declaro que pude hacer preguntas y recibí respuestas comprensibles. Entiendo que puedo decidir no realizar el procedimiento y que los resultados pueden variar. Autorizo voluntariamente la realización del procedimiento descrito. Esta autorización corresponde únicamente al procedimiento aquí indicado.

Profesional: ${professionalName || '_______________________________'}
Fecha del consentimiento: ${date || '__________________'}


FIRMA DEL PACIENTE

Firma: _________________________________

Nombre: ${clientName || '___________________'}

Identificación (si es necesaria): ${clientCedula || '___________________'}

Este formato es una ayuda general. No sustituye la valoración profesional, la historia clínica, la autorización de tratamiento de datos personales ni los requisitos específicos aplicables a cada procedimiento. El profesional debe verificar y completar la información antes de presentarlo al paciente.`;

export const ConsentForm = ({ clientId, clientName, onSuccess, onCancel }: ConsentFormProps) => {
  const { currentUser } = useAuth();
  const [editClientName, setEditClientName] = useState(clientName);
  const [procedureName, setProcedureName] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [consentDate, setConsentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientCedula, setClientCedula] = useState('');
  const [procedureDetails, setProcedureDetails] = useState('');
  const [expectedBenefits, setExpectedBenefits] = useState('');
  const [risksAndEffects, setRisksAndEffects] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [aftercare, setAftercare] = useState('');
  const [patientAcknowledged, setPatientAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePresent, setSignaturePresent] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setSignaturePresent(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setSignaturePresent(false);
      }
    }
  };

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

    if (!consentDate) {
      toast.error('Por favor ingresa la fecha');
      return;
    }

    if (!procedureDetails.trim() || !expectedBenefits.trim() || !risksAndEffects.trim() || !alternatives.trim() || !aftercare.trim()) {
      toast.error('Completa la información específica del procedimiento antes de continuar');
      return;
    }

    if (!patientAcknowledged) {
      toast.error('Confirma que el paciente recibió la información y pudo hacer preguntas');
      return;
    }

    if (!signaturePresent) {
      toast.error('Por favor firma el consentimiento');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Error con el lienzo de firma');
      return;
    }

    setLoading(true);

    try {
      const signatureDataURL = canvas.toDataURL('image/png');
      const consentText = getConsentTemplate({
        clientName: editClientName,
        procedureName,
        professionalName,
        date: consentDate,
        clientCedula,
        procedureDetails,
        expectedBenefits,
        risksAndEffects,
        alternatives,
        aftercare
      });

      const docData = {
        clientId,
        clientName: editClientName,
        procedureName,
        professionalName,
        consentDate,
        clientCedula,
        procedureDetails,
        expectedBenefits,
        risksAndEffects,
        alternatives,
        aftercare,
        patientAcknowledged,
        consentText,
        signatureDataURL,
        signedAt: new Date().toISOString(),
        userId: currentUser.uid,
      };

      console.log('Guardando documento:', docData);
      const { error, id } = await createDocument('clientConsents', docData);

      if (error) {
        console.error('Error al guardar:', error);
        toast.error(`Error al guardar el consentimiento: ${error}`);
        return;
      }

      console.log('Documento guardado con ID:', id);
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
    date: consentDate,
    clientCedula,
    procedureDetails,
    expectedBenefits,
    risksAndEffects,
    alternatives,
    aftercare
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        Este formato es una ayuda general, no asesoría jurídica ni sustituto de la valoración o historia clínica.
        Describe los riesgos y cuidados reales del procedimiento. La autorización para tratar datos sensibles
        o usar fotografías debe gestionarse por separado cuando corresponda. No solicites identificación que
        no sea necesaria.
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

      {/* Professional Name Input */}
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

      {/* Date Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fecha del Consentimiento *
        </label>
        <Input
          type="date"
          value={consentDate}
          onChange={(e) => setConsentDate(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Client Cedula Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cédula/Pasaporte del Cliente (opcional; solo si es necesario)
        </label>
        <Input
          type="text"
          placeholder="Identificación"
          value={clientCedula}
          onChange={(e) => setClientCedula(e.target.value)}
          className="w-full"
        />
      </div>

      <Textarea
        label="Descripción, técnica y zona del procedimiento *"
        placeholder="Describe qué se realizará, con qué técnica y en qué zona."
        value={procedureDetails}
        onChange={(e) => setProcedureDetails(e.target.value)}
      />
      <Textarea
        label="Beneficios esperados y límites del resultado *"
        placeholder="Explica los beneficios esperados y que los resultados pueden variar."
        value={expectedBenefits}
        onChange={(e) => setExpectedBenefits(e.target.value)}
      />
      <Textarea
        label="Riesgos, efectos adversos y contraindicaciones *"
        placeholder="Detalla los riesgos relevantes y contraindicaciones de este procedimiento."
        value={risksAndEffects}
        onChange={(e) => setRisksAndEffects(e.target.value)}
      />
      <Textarea
        label="Alternativas, incluida la opción de no realizarlo *"
        placeholder="Explica las alternativas disponibles."
        value={alternatives}
        onChange={(e) => setAlternatives(e.target.value)}
      />
      <Textarea
        label="Cuidados posteriores y recuperación *"
        placeholder="Indica cuidados, señales de alerta y recuperación prevista."
        value={aftercare}
        onChange={(e) => setAftercare(e.target.value)}
      />

      <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={patientAcknowledged}
          onChange={(e) => setPatientAcknowledged(e.target.checked)}
          className="mt-1 h-4 w-4 accent-primary-600"
        />
        Confirmo que el paciente recibió y comprendió la información específica anterior y tuvo oportunidad de preguntar.
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

      {/* Signature Canvas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Firma Digital del Paciente *
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Firma aquí (usa el dedo en tablet/móvil o mouse en computadora)
            </p>
            <canvas
              ref={canvasRef}
              width={400}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="bg-white border border-gray-300 rounded cursor-crosshair touch-none"
              style={{
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <div className="flex gap-2 w-full">
              <Button
                onClick={clearSignature}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
              {signaturePresent && (
                <div className="flex-1 flex items-center justify-center text-xs text-green-600 bg-green-50 rounded border border-green-300">
                  ✓ Firma capturada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          disabled={loading || !signaturePresent || !procedureName.trim() || !patientAcknowledged}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Consentimiento'}
        </Button>
      </div>
    </div>
  );
};
