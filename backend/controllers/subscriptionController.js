// backend/controllers/subscriptionController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createSubscription = async (req, res) => {
  const { paymentMethodId, plan } = req.body;
  const tenantId = req.headers['x-tenant-id'];

  try {
    // Obtener el tenant
    const tenantResult = await req.db.query(
      'SELECT * FROM public.tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    const tenant = tenantResult.rows[0];
    
    // Obtener el usuario
    const userResult = await req.db.query(
      `SELECT * FROM ${tenant.schema_name}.users WHERE id = $1`,
      [req.userId]
    );
    
    const user = userResult.rows[0];
    
    // Crear o obtener el cliente en Stripe
    let stripeCustomerId = tenant.stripe_customer_id;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: tenant.name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Guardar el ID del cliente de Stripe en la base de datos
      await req.db.query(
        'UPDATE public.tenants SET stripe_customer_id = $1 WHERE id = $2',
        [stripeCustomerId, tenantId]
      );
    }
    
    // Determinar el precio según el plan
    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_ANNUAL_PRICE_ID;
    
    // Crear la suscripción
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });
    
    // Actualizar el plan del tenant
    await req.db.query(
      'UPDATE public.tenants SET plan = $1, subscription_id = $2 WHERE id = $3',
      [plan, subscription.id, tenantId]
    );
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription' });
  }
};

exports.cancelSubscription = async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];

  try {
    // Obtener el tenant
    const tenantResult = await req.db.query(
      'SELECT * FROM public.tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    const tenant = tenantResult.rows[0];
    
    if (!tenant.subscription_id) {
      return res.status(400).json({ message: 'No active subscription found' });
    }
    
    // Cancelar la suscripción en Stripe
    await stripe.subscriptions.cancel(tenant.subscription_id);
    
    // Actualizar el plan del tenant
    await req.db.query(
      'UPDATE public.tenants SET plan = $1, subscription_id = NULL WHERE id = $2',
      ['free', tenantId]
    );
    
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Error cancelling subscription' });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];

  try {
    // Obtener el tenant
    const tenantResult = await req.db.query(
      'SELECT * FROM public.tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    const tenant = tenantResult.rows[0];
    
    if (!tenant.subscription_id) {
      return res.json({
        status: 'inactive',
        plan: tenant.plan
      });
    }
    
    // Obtener la suscripción de Stripe
    const subscription = await stripe.subscriptions.retrieve(tenant.subscription_id);
    
    res.json({
      status: subscription.status,
      plan: tenant.plan,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ message: 'Error getting subscription status' });
  }
};