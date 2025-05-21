"use server";

import { z } from "zod";
import postgres from "postgres";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["paid", "pending"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T").at(0) ?? "";
  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
    revalidatePath("/dashboard/invoices");
  } catch (e) {
    console.error(`Error creating invoice: ${e}`);
  }

  redirect("/dashboard/invoices");
};

export const updateInvoice = async (id: string, formData: FormData) => {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T").at(0) ?? "";

  try {
    await sql`UPDATE invoices 
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}, date=${date}
            WHERE id = ${id}`;
  } catch (e) {
    console.error(`Error updating invoice: ${e}`);
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
};

export const deleteInvoice = async (id: string) => {
  throw new Error("Error deleting invoice");
  try {
    await sql`DELETE from invoices WHERE id = ${id}`;
  } catch (e) {
    console.error(`Error deleting invoice: ${e}`);
  }
  revalidatePath("/dashboard/invoices");
};
