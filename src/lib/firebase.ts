import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ IMPORTANTE: Substitua estas configurações pelas suas credenciais reais do Firebase
// Para obter estas credenciais:
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um novo projeto ou selecione um existente
// 3. Vá em Configurações do Projeto > Geral
// 4. Role até "Seus aplicativos" e clique em "Adicionar app" > Web
// 5. Copie as configurações fornecidas

const firebaseConfig = {
    apiKey: "AIzaSyAf379_pl2lo2sf--IytpxGerpdQD_9IgE", // Usando o apiKey que você forneceu.
    authDomain: "pesquisou-ee03b.firebaseapp.com", // Combinando seu Project ID com .firebaseapp.com.
    projectId: "pesquisou-ee03b", // Seu Project ID.
    storageBucket: "pesquisou-ee03b.firebasestorage.app", // Seu Project ID com .firebasestorage.app, comum para web apps.
    messagingSenderId: "1061458021431", // Seu Project Number.
    appId: "1:1061458021431:web:ee5acd4d1572a8d53c83b2", // O ID específico do seu aplicativo web, extraído do valor que você tinha no projectId.
    // measurementId: "G-SEU_MEASUREMENT_ID" // Se você ativou o Google Analytics 4, adicione o seu Measurement ID aqui (começa com 'G-'). Você o encontra nas configurações do projeto no Firebase Console.
  };  

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
