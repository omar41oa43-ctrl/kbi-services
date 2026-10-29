"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Clock3, KeyRound, Loader2, ShieldCheck, Key, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/firebase/firebaseConfig";
import { authorizedFetch } from "@/lib/authorized-fetch";

type ResetRequest = {
  id: string;
  technicianId: string;
  name: string;
  email: string;
  employeeId: string;
  requestedAt: Date | null;
};

const requestDate = (value: unknown) => {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
};

export function PasswordResetRequestsCard() {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [selected, setSelected] = useState<ResetRequest | null>(null);
  const [deleting, setDeleting] = useState<ResetRequest | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const pendingRequests = query(
      collection(db, "password_reset_requests"),
      where("status", "==", "pending")
    );
    return onSnapshot(
      pendingRequests,
      (snapshot) => {
        setRequests(
          snapshot.docs
            .flatMap((item) => {
              const data = item.data() as Record<string, unknown>;
              if (data.status !== "pending") return [];
              return [
                {
                  id: item.id,
                  technicianId: String(data.technicianId || data.authUid || ""),
                  name: String(data.name || "Technician"),
                  email: String(data.email || "Not recorded"),
                  employeeId: String(data.employeeId || ""),
                  requestedAt: requestDate(data.requestedAt),
                },
              ];
            })
            .sort((left, right) => (right.requestedAt?.getTime() || 0) - (left.requestedAt?.getTime() || 0))
        );
        setLoadError(null);
      },
      (snapshotError) => {
        console.error("Unable to load password reset requests", snapshotError);
        setLoadError("Password reset requests could not be loaded.");
      }
    );
  }, []);

  const closeDialog = () => {
    if (submitting) return;
    setSelected(null);
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const submitReset = async () => {
    if (!selected || submitting) return;
    if (password.length < 12) {
      setError("Use at least 12 characters for the temporary password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await authorizedFetch("/api/admin/technicians/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_PASSWORD",
          technicianId: selected.technicianId,
          data: { password, requestId: selected.id, email: selected.email },
        }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Password could not be reset.");
      }
      setSelected(null);
      setPassword("");
      setConfirmPassword("");
      setError(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "An unexpected error occurred while resetting the password."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRequest = async () => {
    if (!deleting || submitting) return;
    setSubmitting(true);
    setDeleteError(null);
    try {
      const response = await authorizedFetch(
        `/api/admin/password-reset-requests/${encodeURIComponent(deleting.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Request could not be deleted.");
      setDeleting(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Request could not be deleted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Password reset requests unavailable</AlertTitle>
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-4 transition-colors duration-200">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Key className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Password Reset Requests
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Technicians requesting administrator help to regain account access.
              </p>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-mono text-xs">
              {requests.length} Pending
            </Badge>
          </div>
        </div>

        <div className="divide-y divide-border/60 pt-1">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-muted border border-border flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                  {request.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {request.name}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">{request.email}</p>
                  {request.requestedAt && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                      <Clock3 className="size-3" />
                      {request.requestedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => setSelected(request)}
                  className="h-9 px-4 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer hover:brightness-110 shadow-xs shrink-0"
                >
                  <KeyRound className="size-3.5" />
                  Set New Password
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => { setDeleteError(null); setDeleting(request); }}
                  aria-label={`Delete password reset request for ${request.email}`}
                >
                  <Trash2 className="size-3.5 mr-1.5" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="rounded-2xl border border-border bg-card text-card-foreground max-w-md p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShieldCheck className="size-5 text-primary" />
              Reset Technician Password
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set a temporary password for <strong>{selected?.name}</strong> ({selected?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertTitle className="text-xs">Password issue</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reset-new-password" className="text-xs font-semibold text-muted-foreground">New Temporary Password *</Label>
              <Input
                id="reset-new-password"
                autoComplete="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 12 characters"
                className="h-10 text-xs bg-background border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm-password" className="text-xs font-semibold text-muted-foreground">Confirm Password *</Label>
              <Input
                id="reset-confirm-password"
                autoComplete="new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="h-10 text-xs bg-background border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={closeDialog} disabled={submitting} className="rounded-xl">
              Cancel
            </Button>
            <Button size="sm" onClick={submitReset} disabled={submitting} className="rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110">
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Updating...
                </>
              ) : (
                "Save Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleting)} onOpenChange={(open) => {
        if (!open && !submitting) { setDeleting(null); setDeleteError(null); }
      }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete password reset request?</DialogTitle>
            <DialogDescription>
              Remove the request for <strong>{deleting?.email}</strong> from the pending list.
              The technician’s account and password will stay unchanged. An audit record is retained.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <Alert variant="destructive"><AlertDescription>{deleteError}</AlertDescription></Alert>}
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={submitting} onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" disabled={submitting} onClick={deleteRequest}>
              {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" /> Deleting…</> : "Delete Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
