"use client";
import { useEffect } from "react";
import { useDispatch, Provider } from "react-redux";
import { setEmail, setId, setUsername } from "@stores/userSlice";
import store from "@stores/store";

interface ClientProviderProps {
  id: string;
  email: string;
  username: string;
  children: React.ReactNode;
}

function UserProvider({ id, email, username, children }: ClientProviderProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setId(id));
    dispatch(setEmail(email));
    dispatch(setUsername(username));
  }, [id, email, username, dispatch]);

  return <>{children}</>;
}

export default function ClientProvider({
  id,
  email,
  username,
  children,
}: ClientProviderProps) {
  return (
    <Provider store={store}>
      <UserProvider id={id} email={email} username={username}>
        {children}
      </UserProvider>
    </Provider>
  );
}
