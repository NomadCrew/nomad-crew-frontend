import { initializeApp } from "firebase/app";
import { ref } from "vue";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_APP_ID,
  measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID
};


// export function useFirebaseSevice() {  
//   const Initialized = ref(false);
//   !Capacitor.isNativePlatform()
//       && FirebaseAuthentication.addListener("authStateChange", async (result) => {
//           if(result.user){
//               console.log("User is signed in", await getAuth().currentUser);
//           } else {
//               console.log("No user found");
//           }
//           initialized.value = true;
//       });   
// }
// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// export default app;
