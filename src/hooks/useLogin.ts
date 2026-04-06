import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { setCredentials } from "#/lib/auth";
import { getEnv } from "#/lib/env";
import type { LoginFormValues } from "#/schemas/auth";

async function verifyCredentials(username: string, password: string) {
  await axios.get(`${getEnv("VITE_API_BASE_URL")}/query/getHeader`, {
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    },
  });
}

export function useLogin() {
  const navigate = useNavigate();

  const { mutate: login, isPending, isError } = useMutation({
    mutationFn: ({ username, password }: LoginFormValues) =>
      verifyCredentials(username, password),
    onSuccess: (_, { username, password }) => {
      setCredentials(username, password);
      navigate({ to: "/" });
    },
  });

  return { login, isPending, isError };
}
