import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

const handleStriopeWebhookEvent = async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findUnique({
    where: {
      stripeEventId: event.id,
    },
  });

  if (existingPayment) {
    console.log(`Event ${event.id} already processed. Skipping`);
    return { message: `Event ${event.id} already processed. Skipping` };
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as any;

      const appointmentId = session.metadata?.appointmentId;
      const paymentId = session.metadata?.paymentId;

      if (!appointmentId || !paymentId) {
        console.error("⚠️ Missing metadata in webhook event");
        return { message: "Missing metadata" };
      }

      const paymentRecord = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          student: true,
          parent: { include: { user: true } },
        },
      });

      if (!paymentRecord) {
        console.error(`⚠️ Payment record ${paymentId} not found.`);
        return { message: "Payment not found" };
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: session.payment_status === "paid" ? "PAID" : "PENDING",
            paymentGatewayData: session as any,
            stripeEventId: event.id,
            // এখানে আপনি চাইলে invoiceUrl বা অন্য কিছু আপডেট করতে পারেন
          },
        });

        return { updatedPayment };
      });
  }
};
