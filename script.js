document.addEventListener('DOMContentLoaded', () => {
    // Configuración de precisión y redondeo
    const CONFIG = {
        DECIMALS: 2,
        ROUNDING_RULES: {
            money: (num) => {
                return Math.round(num * Math.pow(10, CONFIG.DECIMALS)) / Math.pow(10, CONFIG.DECIMALS);
            },
            excess: (num) => {
                return Math.ceil(num * Math.pow(10, CONFIG.DECIMALS)) / Math.pow(10, CONFIG.DECIMALS);
            },
            profit: (num) => {
                return Math.floor(num * Math.pow(10, CONFIG.DECIMALS)) / Math.pow(10, CONFIG.DECIMALS);
            }
        }
    };

    const form = document.getElementById('paymentForm');
    const paymentCurrencySelect = document.getElementById('paymentCurrency');
    const usdPaymentDiv = document.getElementById('usdPayment');
    const resultsDiv = document.getElementById('results');
    const productCountInput = document.getElementById('productCount');
    const productPricesContainer = document.getElementById('productPricesContainer');

    // Mostrar/ocultar el campo de pago en USD según la moneda seleccionada
    paymentCurrencySelect.addEventListener('change', () => {
        usdPaymentDiv.style.display = paymentCurrencySelect.value === 'USD' ? 'block' : 'none';
    });

    // Generar campos de precios cuando se cambia la cantidad de productos
    productCountInput.addEventListener('change', () => {
        const count = parseInt(productCountInput.value);
        if (isNaN(count) || count <= 0) {
            productPricesContainer.innerHTML = '<h3>Precios por producto</h3>';
            return;
        }

        const pricesHTML = `
            <h3>Precios por producto</h3>
            ${Array.from({ length: count }).map((_, i) => `
                <div class="input-group">
                    <label for="productPrice${i + 1}">Precio del producto ${i + 1}:</label>
                    <input type="number" id="productPrice${i + 1}" step="0.01" required>
                </div>
            `).join('')}
        `;
        productPricesContainer.innerHTML = pricesHTML;
    });

    // Función para realizar cálculos precisos
    const preciseCalculation = {
        add: (a, b) => {
            const base = Math.pow(10, CONFIG.DECIMALS);
            return CONFIG.ROUNDING_RULES.money((a * base + b * base) / base);
        },
        subtract: (a, b) => {
            const base = Math.pow(10, CONFIG.DECIMALS);
            return CONFIG.ROUNDING_RULES.money((a * base - b * base) / base);
        },
        multiply: (a, b) => {
            const base = Math.pow(10, CONFIG.DECIMALS);
            return CONFIG.ROUNDING_RULES.money((a * b * base) / base);
        },
        divide: (a, b) => {
            const base = Math.pow(10, CONFIG.DECIMALS);
            return CONFIG.ROUNDING_RULES.money((a * base) / (b * base));
        },
        round: (value) => {
            const base = Math.pow(10, CONFIG.DECIMALS);
            return CONFIG.ROUNDING_RULES.money(value * base) / base;
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Obtener valores del formulario
        const exchangeRate = preciseCalculation.round(parseFloat(document.getElementById('exchangeRate').value));
        const totalAmount = preciseCalculation.round(parseFloat(document.getElementById('totalAmount').value));
        const paymentCurrency = paymentCurrencySelect.value;
        const usdPaymentAmount = preciseCalculation.round(parseFloat(document.getElementById('usdPaymentAmount').value));

        // Obtener precios de los productos
        const productCount = parseInt(productCountInput.value);
        let totalOriginal = 0;
        let allPricesValid = true;

        for (let i = 1; i <= productCount; i++) {
            const price = parseFloat(document.getElementById(`productPrice${i}`).value);
            if (isNaN(price)) {
                alert(`Por favor, ingrese el precio del producto ${i}.`);
                allPricesValid = false;
                break;
            }
            totalOriginal = preciseCalculation.add(totalOriginal, price);
        }

        if (!allPricesValid) return;

        // Validar que se hayan ingresado todos los campos requeridos
        if (isNaN(exchangeRate) || isNaN(totalAmount) || isNaN(productCount) || productCount <= 0) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        // Si se paga en USD, validar que se haya ingresado el monto
        if (paymentCurrency === 'USD' && isNaN(usdPaymentAmount)) {
            alert('Por favor, ingrese el monto a pagar en USD.');
            return;
        }

        // Calcular resultados
        let results = {};

        if (paymentCurrency === 'USD') {
            // Calcular excedente en USD y convertir a CUP
            const totalInUSD = preciseCalculation.divide(totalAmount, exchangeRate);
            const excessUSD = CONFIG.ROUNDING_RULES.excess(preciseCalculation.subtract(usdPaymentAmount, totalInUSD));
            const excessCUP = CONFIG.ROUNDING_RULES.excess(preciseCalculation.multiply(excessUSD, exchangeRate));
            
            results.excess = `Excedente: $${excessUSD.toFixed(2)} USD (${excessCUP.toFixed(2)} CUP)`;
            results.totalUSD = `Monto total en USD: $${totalInUSD.toFixed(2)}`;
        }

        // Calcular ganancia del gestor
        const managerProfit = Math.abs(CONFIG.ROUNDING_RULES.profit(preciseCalculation.subtract(totalOriginal, totalAmount)));
        results.managerProfit = `Ganancia del gestor: ${managerProfit.toFixed(2)} CUP`;

        // Mostrar resultados
        resultsDiv.style.display = 'block';
        document.getElementById('excessAmount').innerHTML = results.excess || '';
        document.getElementById('managerProfit').innerHTML = results.managerProfit;
        
        // Mostrar el monto total en USD si se paga en USD
        if (results.totalUSD) {
            const totalUSDElement = document.getElementById('totalUSD');
            if (!totalUSDElement) {
                const newDiv = document.createElement('div');
                newDiv.id = 'totalUSD';
                document.getElementById('results').appendChild(newDiv);
            }
            document.getElementById('totalUSD').innerHTML = results.totalUSD;
        }
    });
});
