import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import type { DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from './config';

// Generic CRUD operations

// Create a document with timeout
const withTimeout = <T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('La operación está tardando demasiado. Verifica tu conexión a internet y las reglas de Firebase.')), timeoutMs)
    )
  ]);
};

export const createDocument = async (
  collectionName: string,
  data: DocumentData
) => {
  try {
    console.log('Creando documento en', collectionName, data);
    const docRef = await withTimeout(
      addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    );
    console.log('Documento creado con ID:', docRef.id);
    return { id: docRef.id, error: null };
  } catch (error: any) {
    console.error('Error al crear documento:', error);
    const errorMessage = error.code === 'permission-denied'
      ? 'No tienes permisos. Configura las reglas de Firestore en Firebase Console.'
      : error.message;
    return { id: null, error: errorMessage };
  }
};

// Read a single document
export const getDocument = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        data: { id: docSnap.id, ...docSnap.data() },
        error: null
      };
    } else {
      return { data: null, error: 'Document not found' };
    }
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Read all documents in a collection
export const getDocuments = async (
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return { data: documents, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
};

// Update a document
export const updateDocument = async (
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
) => {
  try {
    console.log('Actualizando documento', id, 'en', collectionName);
    const docRef = doc(db, collectionName, id);
    await withTimeout(
      updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      })
    );
    console.log('Documento actualizado exitosamente');
    return { error: null };
  } catch (error: any) {
    console.error('Error al actualizar documento:', error);
    const errorMessage = error.code === 'permission-denied'
      ? 'No tienes permisos. Configura las reglas de Firestore en Firebase Console.'
      : error.message;
    return { error: errorMessage };
  }
};

// Delete a document
export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Query documents with filters
export const queryDocuments = async (
  collectionName: string,
  filters: { field: string; operator: any; value: any }[],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc'
) => {
  try {
    const constraints: QueryConstraint[] = filters.map((filter) =>
      where(filter.field, filter.operator, filter.value)
    );

    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    const documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return { data: documents, error: null };
  } catch (error: any) {
    return { data: [], error: error.message };
  }
};

// Export Firestore helpers
export { Timestamp, where, orderBy };
