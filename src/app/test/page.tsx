'use client';

import { useState } from 'react';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

export default function TestPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testFirestoreWrite = async () => {
    setLoading(true);
    setResult('Testando escrita...');

    try {
      console.log('=== TESTE ESCRITA FIRESTORE ===');
      console.log('Firebase db:', db);
      console.log('Usuário autenticado:', auth.currentUser);
      
      const testData = {
        test: true,
        timestamp: new Date(),
        message: 'Teste de escrita',
        areaId: 'test-area'
      };

      console.log('Dados de teste:', testData);
      
      const docRef = await addDoc(collection(db, 'feedbacks'), testData);
      
      console.log('✅ Documento criado com sucesso!');
      console.log('ID:', docRef.id);
      
      setResult(`✅ Sucesso! Documento criado com ID: ${docRef.id}`);
    } catch (error) {
      console.error('❌ Erro na escrita:', error);
      setResult(`❌ Erro na escrita: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const testFirestoreRead = async () => {
    setLoading(true);
    setResult('Testando leitura...');

    try {
      console.log('=== TESTE LEITURA FIRESTORE ===');
      console.log('Firebase db:', db);
      
      const querySnapshot = await getDocs(collection(db, 'feedbacks'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('✅ Leitura bem-sucedida!');
      console.log('Documentos encontrados:', docs.length);
      
      setResult(`✅ Leitura bem-sucedida! ${docs.length} documentos encontrados`);
    } catch (error) {
      console.error('❌ Erro na leitura:', error);
      setResult(`❌ Erro na leitura: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const testFirebaseConnection = async () => {
    setLoading(true);
    setResult('Testando conexão...');

    try {
      console.log('=== TESTE CONEXÃO FIREBASE ===');
      console.log('Firebase db:', db);
      console.log('Firebase auth:', auth);
      
      setResult('✅ Firebase conectado corretamente!');
    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      setResult(`❌ Erro na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Teste Firestore</h1>
        
        <div className="space-y-4">
          <button
            onClick={testFirebaseConnection}
            disabled={loading}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Testar Conexão'}
          </button>
          
          <button
            onClick={testFirestoreWrite}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Testar Escrita'}
          </button>
          
          <button
            onClick={testFirestoreRead}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testando...' : 'Testar Leitura'}
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Esta página testa as permissões do Firestore.</p>
          <p>Se a escrita falhar, as regras precisam ser corrigidas.</p>
          <p>Verifique o console do navegador para mais detalhes.</p>
        </div>
      </div>
    </div>
  );
} 