import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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

const getConsentTemplate = (clientName: string, procedureName: string, professionalName: string, date: string, clientCedula: string) => `CONSENTIMIENTO INFORMADO PARA PROCEDIMIENTO ESTÉTICO

Yo, ${clientName || '___________________'}, con cédula/pasaporte ${clientCedula || '_________________'}, declaro que he recibido información clara y completa sobre el procedimiento: ${procedureName || '___________________'}.

INFORMACIÓN SOBRE EL PROCEDIMIENTO:
He sido informado(a) sobre:
• La naturaleza del procedimiento
• Los beneficios esperados
• Los posibles riesgos y efectos secundarios
• Las alternativas de tratamiento disponibles
• El tiempo de recuperación esperado

CONSIDERACIONES IMPORTANTES:
• Este procedimiento puede causar enrojecimiento, inflamación o molestias temporales
• Se recomienda evitar la exposición solar directa por 48 horas
• Es importante seguir las instrucciones post-procedimiento
• Se pueden requerir sesiones de seguimiento

AUTORIZACIÓN:
Reconozco que:
✓ He sido informado(a) completamente sobre el procedimiento
✓ He tenido la oportunidad de hacer preguntas
✓ Entiendo los riesgos y beneficios
✓ Consiento voluntariamente en recibir este procedimiento
✓ Autorizo al profesional a llevar a cabo el procedimiento

Procedimiento realizado por: ${professionalName || '_______________________________'}
Fecha: ${date || '__________________'}


FIRMA DEL PACIENTE

Firma: _________________________________

Nombre: ${clientName || '___________________'}

Cédula: ${clientCedula || '___________________'}`;

export const ConsentForm = ({ clientId, clientName, onSuccess, onCancel }: ConsentFormProps) => {
  const { currentUser } = useAuth();
  const [editClientName, setEditClientName] = useState(clientName);
  const [procedureName, setProcedureName] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [consentDate, setConsentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clientCedula, setClientCedula] = useState('');
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

    if (!clientCedula.trim()) {
      toast.error('Por favor ingresa la cédula del cliente');
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
      const consentText = getConsentTemplate(editClientName, procedureName, professionalName, consentDate, clientCedula);

      const docData = {
        clientId,
        clientName: editClientName,
        procedureName,
        professionalName,
        consentDate,
        clientCedula,
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

  const consentPreview = getConsentTemplate(
    editClientName || '[Nombre del cliente]',
    procedureName || '[Nombre del procedimiento]',
    professionalName || '[Nombre del profesional]',
    consentDate,
    clientCedula || '[Cédula del cliente]'
  );

  return (
    <div className="space-y-4">
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
          Cédula/Pasaporte del Cliente *
        </label>
        <Input
          type="text"
          placeholder="Ingresa la cédula o pasaporte"
          value={clientCedula}
          onChange={(e) => setClientCedula(e.target.value)}
          className="w-full"
        />
      </div>

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
          disabled={loading || !signaturePresent || !procedureName.trim()}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Consentimiento'}
        </Button>
      </div>
    </div>
  );
};
