import { useAuth } from "./contexts/AuthProvider";

export default function TestContext() {
  try {
    const auth = useAuth();
    console.log('TestContext - auth:', auth);
    return <div>Auth доступен: {JSON.stringify(auth)}</div>;
  } catch (error: any) {
    console.log('TestContext - ошибка:', error.message);
    return <div>Ошибка: {error.message}</div>;
  }
}