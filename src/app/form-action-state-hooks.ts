"use client";

import { useActionState } from "react";
import {
  createEventAction,
  joinEventAction,
  type CreateEventState,
  type JoinState,
} from "@/app/actions";

export function useJoinFormState() {
  return useActionState<JoinState | null, FormData>(joinEventAction, null);
}

export function useCreateEventFormState() {
  return useActionState<CreateEventState | null, FormData>(createEventAction, null);
}

