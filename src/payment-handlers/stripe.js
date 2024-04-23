import Stripe from "stripe";

export const createCheckOutSession = async({
    customer_email,
    metadata,
    discounts,
    line_items,
    success_url,
    cancel_url
}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentData = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email,
        metadata,
        line_items,
        discounts,
        success_url,
        cancel_url
    })
    return paymentData
}

export const createCheckOutSessionForAuction = async({
    customer_email,
    metadata,
    success_url,
    cancel_url
}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentDataForAuction = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        metadata,
        customer_email,
        line_items:[
            {
                quantity: 1,
                price_data: {
                    currency: 'EGP',
                    unit_amount: 200 * 100,
                    product_data: {
                        name: 'Art Space Auction',
                    },
                },
            }
        ],
        success_url,
        cancel_url
    })
    return paymentDataForAuction
}

export const createStripePaymentMethod = async ({token})=> {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {token}
    })
    return paymentMethod
}

export const createPaymentIntent = async ({amount, currency}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentMethod = await createStripePaymentMethod({token: 'tok_visa'});
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency,
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
        },
        payment_method: paymentMethod.id,
    });
    return paymentIntent;
}

export const retrievePaymentIntent = async ({paymentIntentId}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
}

export const confirmPaymentIntent = async ({paymentIntentId}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentDetails = await retrievePaymentIntent ({paymentIntentId});
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentDetails.payment_method
    });
    return paymentIntent;
}

export const refundPaymentIntent = async ({paymentIntentId}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
    });
    return refund;
}
