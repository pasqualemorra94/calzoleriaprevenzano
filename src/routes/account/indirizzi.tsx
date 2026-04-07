import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2, Star, MapPin } from "lucide-react";
import { toast } from "sonner";
import { m, AnimatePresence } from "motion/react";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

const emptyAddress = {
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "IT",
  phone: "",
  isDefault: false,
};

export const Route = createFileRoute("/account/indirizzi")({
  component: AddressesPage,
});

function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyAddress });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses");
      const json = await res.json();
      if (json.ok) setAddresses(json.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const openNewForm = () => {
    setForm({ ...emptyAddress });
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (addr: Address) => {
    setForm({
      firstName: addr.firstName,
      lastName: addr.lastName,
      address1: addr.address1,
      address2: addr.address2 ?? "",
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: addr.phone ?? "",
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (form.firstName.trim().length < 1) newErrors.firstName = "Obbligatorio";
    if (form.lastName.trim().length < 1) newErrors.lastName = "Obbligatorio";
    if (form.address1.trim().length < 1) newErrors.address1 = "Obbligatorio";
    if (form.city.trim().length < 1) newErrors.city = "Obbligatorio";
    if (form.province.trim().length !== 2) newErrors.province = "2 caratteri";
    if (!/^\d{5}$/.test(form.postalCode)) newErrors.postalCode = "5 cifre";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const body = {
        ...form,
        address2: form.address2 || undefined,
        phone: form.phone || undefined,
      };

      const isEdit = editingId !== null;
      const url = isEdit ? `/api/addresses/${editingId}` : "/api/addresses";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(isEdit ? "Indirizzo aggiornato" : "Indirizzo aggiunto");
        cancelForm();
        fetchAddresses();
      } else {
        toast.error(json.error?.message ?? "Errore durante il salvataggio");
      }
    } catch {
      toast.error("Errore di connessione");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Vuoi eliminare questo indirizzo?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("Indirizzo eliminato");
        fetchAddresses();
      }
    } catch { /* ignore */ }
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-text)]">
          I miei indirizzi
        </h1>
        <button
          onClick={openNewForm}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          <Plus className="h-4 w-4" />
          Aggiungi
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-6">
              <h2 className="font-display text-base font-semibold text-[var(--color-text)] mb-4">
                {editingId ? "Modifica indirizzo" : "Nuovo indirizzo"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-[var(--color-text)] mb-1">Nome</label>
                    <input id="firstName" type="text" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)}
                      className={cn(inputClass, errors.firstName && inputErrorClass)} placeholder="Nome" />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-[var(--color-text)] mb-1">Cognome</label>
                    <input id="lastName" type="text" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)}
                      className={cn(inputClass, errors.lastName && inputErrorClass)} placeholder="Cognome" />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address1" className="block text-sm font-medium text-[var(--color-text)] mb-1">Indirizzo</label>
                    <input id="address1" type="text" value={form.address1} onChange={(e) => updateField("address1", e.target.value)}
                      className={cn(inputClass, errors.address1 && inputErrorClass)} placeholder="Via/Piazza, numero" />
                    {errors.address1 && <p className="mt-1 text-xs text-red-500">{errors.address1}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address2" className="block text-sm font-medium text-[var(--color-text)] mb-1">Indirizzo 2 (opzionale)</label>
                    <input id="address2" type="text" value={form.address2} onChange={(e) => updateField("address2", e.target.value)}
                      className={inputClass} placeholder="Appartamento, interno, scala" />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-[var(--color-text)] mb-1">Città</label>
                    <input id="city" type="text" value={form.city} onChange={(e) => updateField("city", e.target.value)}
                      className={cn(inputClass, errors.city && inputErrorClass)} placeholder="Città" />
                    {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-[var(--color-text)] mb-1">Provincia</label>
                    <input id="province" type="text" value={form.province} onChange={(e) => updateField("province", e.target.value)}
                      className={cn(inputClass, errors.province && inputErrorClass)} placeholder="NA" maxLength={2} />
                    {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-[var(--color-text)] mb-1">CAP</label>
                    <input id="postalCode" type="text" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)}
                      className={cn(inputClass, errors.postalCode && inputErrorClass)} placeholder="80132" maxLength={5} />
                    {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-text)] mb-1">Telefono (opzionale)</label>
                    <input id="phone" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                      className={inputClass} placeholder="+39 333 1234567" />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => updateField("isDefault", e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">Imposta come indirizzo predefinito</span>
                </label>
                <div className="flex items-center gap-3 mt-6">
                  <button type="submit" disabled={saving}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {editingId ? "Salva" : "Aggiungi"}
                  </button>
                  <button type="button" onClick={cancelForm}
                    className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] px-6 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-muted)]">
                    Annulla
                  </button>
                </div>
              </form>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] py-16 text-center">
          <MapPin className="h-10 w-10 text-[var(--color-text-muted)] mb-4" />
          <h3 className="font-display text-lg font-semibold text-[var(--color-text)] mb-2">Nessun indirizzo salvato</h3>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
            Aggiungi un indirizzo per velocizzare il checkout.
          </p>
          <button onClick={openNewForm}
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]">
            <Plus className="h-4 w-4" />
            Aggiungi indirizzo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[var(--color-primary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {addr.firstName} {addr.lastName}
                      {addr.isDefault && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                          <Star className="h-3 w-3" />
                          Predefinito
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {addr.address1}{addr.address2 ? `, ${addr.address2}` : ""}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {addr.postalCode} {addr.city} ({addr.province})
                    </p>
                    {addr.phone && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        Tel: {addr.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border-light)]">
                  <button
                    onClick={() => openEditForm(addr)}
                    className="text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </m.div>
  );
}

const inputClass = "w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";
const inputErrorClass = "!border-red-300 focus:!border-red-500 focus:!ring-red-500";

import { cn } from "~/lib/utils/cn";
