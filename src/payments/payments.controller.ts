import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly config: ConfigService) {}

  @Post()
  processPaddlePayment(@Body() body) {
    console.log(body);
  }

  @Post('create-payment-intent')
  async createPaymentIntent() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const stripe = require('stripe')(this.config.get('STRIPE_SECRET_KEY'), {
        apiVersion: '2022-08-01',
      });

      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: 500,
        automatic_payment_methods: { enabled: true },
      });

      return { ok: true, clientSecret: paymentIntent.client_secret };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}
