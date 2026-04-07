/**
 * Address Service — server-only
 *
 * Business logic for address CRUD (user's saved addresses).
 */

import { prisma } from "~/lib/db.server";

interface AddressData {
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
  createdAt: string;
}

interface AddressRawRow {
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
  createdAt: Date;
}

function toAddress(row: AddressRawRow): AddressData {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Get all addresses for a user */
export async function getAddresses(userId: string): Promise<AddressData[]> {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return addresses.map(toAddress);
}

/** Create a new address. If isDefault, unset other defaults. */
export async function createAddress(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  },
): Promise<AddressData> {
  const { isDefault, ...input } = data;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      ...input,
      userId,
      isDefault: isDefault ?? false,
    },
  });

  return toAddress(address);
}

/** Update an existing address */
export async function updateAddress(
  addressId: string,
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    isDefault?: boolean;
  },
): Promise<AddressData> {
  const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!existing) throw new Error("Indirizzo non trovato");

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({
    where: { id: addressId },
    data,
  });

  return toAddress(updated);
}

/** Delete an address */
export async function deleteAddress(addressId: string, userId: string): Promise<void> {
  const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!existing) throw new Error("Indirizzo non trovato");
  await prisma.address.delete({ where: { id: addressId } });
}
