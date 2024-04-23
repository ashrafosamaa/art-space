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
