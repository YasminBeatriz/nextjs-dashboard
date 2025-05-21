"use server";

import { z } from "zod";
import postgres from "postgres";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({ invalid_type_error: "Please select a customer." }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["paid", "pending"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string({ invalid_type_error: "Please select an invoice status." }),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (prevState: State, formData: FormData) => {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  console.log('validatedFields', { success: validatedFields.success, error: validatedFields.error?.flatten().fieldErrors });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to create invoice",
    };
  }
  const { customerId, amount, status} = validatedFields.data;
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
