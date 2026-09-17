-- AlterTable
ALTER TABLE "Order" ADD COLUMN "subtotal" DOUBLE PRECISION,
ADD COLUMN "taxAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "shippingFee" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "discountAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "shippingAddress" JSONB,
ADD COLUMN "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "razorpayOrderId" TEXT,
ADD COLUMN "razorpayPaymentId" TEXT,
ADD COLUMN "razorpaySignature" TEXT,
ALTER COLUMN "provider" SET DEFAULT 'RAZORPAY';

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
