async function fetchPayment(price, event_name) {
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ price, event_name })
        });

        const result = await response.json();
        const { url } = result;

        window.location.href = url;
    } catch (error) {
        console.error('Error redirecting to checkout:', error);
    }
}