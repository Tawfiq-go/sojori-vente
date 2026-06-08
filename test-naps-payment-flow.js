#!/usr/bin/env node
/**
 * Script de test du flux de paiement NAPS complet
 *
 * Ce script teste:
 * 1. Récupération de la clé publique RSA
 * 2. Chiffrement des données de carte côté client
 * 3. Création d'un PaymentIntent
 * 4. Confirmation du paiement avec carte chiffrée
 *
 * Carte de test NAPS:
 * - Numéro: 5234567890123255
 * - Expiration: 12/25
 * - CVV: 123
 * - Type: MasterCard
 * - Status: Approuvé (00)
 *
 * Usage:
 *   node test-naps-payment-flow.js [API_URL]
 *
 * Exemple:
 *   node test-naps-payment-flow.js http://localhost:14004
 */

const crypto = require('crypto');

// Configuration
const API_BASE_URL = process.argv[2] || 'http://localhost:14004';
const API_PAYMENTS_URL = `${API_BASE_URL}/api/v1/payments`;

// Carte de test NAPS
const TEST_CARD = {
  number: '5234567890123255',
  cvv: '123',
  expiryMonth: '12',
  expiryYear: '25',
  holderName: 'TEST USER'
};

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

/**
 * Étape 1: Récupérer la clé publique RSA
 */
async function getPublicKey() {
  logStep('1/4', 'Récupération de la clé publique RSA');

  try {
    const response = await fetch(`${API_PAYMENTS_URL}/public-key`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch public key');
    }

    const publicKey = data.data.publicKey;

    if (!publicKey || typeof publicKey !== 'string' || !publicKey.includes('BEGIN PUBLIC KEY')) {
      logWarning('La clé publique semble vide ou invalide');
      logWarning('Ceci est probablement dû à un bug dans paymentIntents.ts ligne 108');
      logWarning('Fix requis: const publicKey = await getPublicKey()');
      console.log('\nRéponse reçue:', JSON.stringify(data, null, 2));
      throw new Error('Public key is empty or invalid');
    }

    logSuccess(`Clé publique récupérée (${publicKey.length} caractères)`);
    log(`Algorithm: ${data.data.algorithm}`, colors.blue);
    log(`Hash: ${data.data.hash}`, colors.blue);

    return publicKey;
  } catch (error) {
    logError(`Erreur lors de la récupération de la clé: ${error.message}`);
    throw error;
  }
}

/**
 * Étape 2: Chiffrer les données de carte avec RSA-OAEP
 */
function encryptCardData(cardData, publicKey) {
  logStep('2/4', 'Chiffrement des données de carte');

  try {
    // Convertir les données en JSON
    const jsonData = JSON.stringify(cardData);

    // Chiffrer avec RSA-OAEP SHA-256
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(jsonData, 'utf8')
    );

    // Encoder en base64
    const encryptedBase64 = encrypted.toString('base64');

    logSuccess(`Carte chiffrée (${encryptedBase64.length} caractères)`);
    log(`Données originales: ${jsonData}`, colors.blue);
    log(`Données chiffrées: ${encryptedBase64.substring(0, 50)}...`, colors.blue);

    return encryptedBase64;
  } catch (error) {
    logError(`Erreur lors du chiffrement: ${error.message}`);
    throw error;
  }
}

/**
 * Étape 3: Créer un PaymentIntent
 */
async function createPaymentIntent() {
  logStep('3/4', 'Création du PaymentIntent');

  const payload = {
    amount: 15000, // 150.00 MAD
    currency: '504', // MAD
    context: {
      type: 'reservation',
      referenceId: 'TEST_RESERVATION_001',
    },
    guest: {
      firstName: 'Mohamed',
      lastName: 'Alami',
      email: 'test@sojori.com',
      phone: '+212600000000',
    },
    metadata: {
      test: 'true',
      source: 'test-script',
    },
  };

  try {
    const response = await fetch(`${API_PAYMENTS_URL}/intents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    const intentId = data.data.id;
    logSuccess(`PaymentIntent créé: ${intentId}`);
    log(`Montant: ${data.data.amount / 100} MAD`, colors.blue);
    log(`Status: ${data.data.status}`, colors.blue);

    return intentId;
  } catch (error) {
    logError(`Erreur lors de la création du PaymentIntent: ${error.message}`);
    throw error;
  }
}

/**
 * Étape 4: Confirmer le paiement avec carte chiffrée
 */
async function confirmPayment(intentId, encryptedCardData) {
  logStep('4/4', 'Confirmation du paiement');

  const payload = {
    encryptedCardData,
  };

  try {
    const response = await fetch(`${API_PAYMENTS_URL}/intents/${intentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.requiresAction) {
      logWarning('Challenge 3DS requis');
      log(`URL d'action: ${data.actionUrl}`, colors.blue);
      return { success: false, requiresAction: true, actionUrl: data.actionUrl };
    }

    if (!data.success) {
      throw new Error(data.error || 'Payment confirmation failed');
    }

    logSuccess(`Paiement confirmé!`);
    log(`Status: ${data.data.status}`, colors.blue);
    console.log('\nRéponse complète:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    logError(`Erreur lors de la confirmation: ${error.message}`);
    throw error;
  }
}

/**
 * Flux complet
 */
async function runFullTest() {
  log('\n========================================', colors.cyan);
  log('  TEST FLUX PAIEMENT NAPS COMPLET', colors.cyan);
  log('========================================\n', colors.cyan);

  log(`API URL: ${API_BASE_URL}`, colors.blue);
  log(`Carte de test: ${TEST_CARD.number}`, colors.blue);
  log(`Expiration: ${TEST_CARD.expiryMonth}/${TEST_CARD.expiryYear}`, colors.blue);
  log(`CVV: ${TEST_CARD.cvv}\n`, colors.blue);

  try {
    // Étape 1: Récupérer la clé publique
    const publicKey = await getPublicKey();

    // Étape 2: Chiffrer la carte
    const encryptedCard = encryptCardData(TEST_CARD, publicKey);

    // Étape 3: Créer PaymentIntent
    const intentId = await createPaymentIntent();

    // Étape 4: Confirmer le paiement
    const result = await confirmPayment(intentId, encryptedCard);

    log('\n========================================', colors.green);
    log('  ✅ TEST RÉUSSI!', colors.green);
    log('========================================\n', colors.green);

    process.exit(0);
  } catch (error) {
    log('\n========================================', colors.red);
    log('  ❌ TEST ÉCHOUÉ', colors.red);
    log('========================================\n', colors.red);

    console.error(error);
    process.exit(1);
  }
}

// Exécuter le test
runFullTest();
