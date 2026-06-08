/**
 * Card Encryption Utilities - Client Side (Browser)
 *
 * Encrypts card data using RSA-OAEP with SHA-256
 * before sending to backend for secure payment processing.
 */

export interface CardData {
  number: string
  cvv: string
  expiryMonth: string
  expiryYear: string
  holderName: string
}

/**
 * Convert PEM public key to CryptoKey for Web Crypto API
 */
async function importPublicKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM headers and decode base64
  const pemContents = pemKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '')

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  )
}

/**
 * Encrypt card data with RSA-OAEP public key
 */
export async function encryptCardData(
  cardData: CardData,
  publicKeyPem: string
): Promise<string> {
  try {
    // Convert card data to JSON
    const jsonData = JSON.stringify(cardData)
    const dataBuffer = new TextEncoder().encode(jsonData)

    // Import public key
    const publicKey = await importPublicKey(publicKeyPem)

    // Encrypt with RSA-OAEP SHA-256
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      dataBuffer
    )

    // Convert to base64
    const encryptedArray = new Uint8Array(encryptedBuffer)
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))

    return encryptedBase64
  } catch (error) {
    console.error('[CardEncryption] Encryption failed:', error)
    throw new Error('Failed to encrypt card data')
  }
}

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')

  if (digits.length < 13 || digits.length > 19) {
    return false
  }

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Validate CVV (3 or 4 digits)
 */
export function validateCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv)
}

/**
 * Validate expiry date (MM/YY format)
 */
export function validateExpiry(month: string, year: string): boolean {
  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)

  if (monthNum < 1 || monthNum > 12) {
    return false
  }

  // Get current date
  const now = new Date()
  const currentYear = now.getFullYear() % 100 // Get last 2 digits
  const currentMonth = now.getMonth() + 1

  // Check if expired
  if (yearNum < currentYear) {
    return false
  }

  if (yearNum === currentYear && monthNum < currentMonth) {
    return false
  }

  return true
}

/**
 * Format card number with spaces (XXXX XXXX XXXX XXXX)
 */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '')
  const groups = digits.match(/.{1,4}/g) || []
  return groups.join(' ').substring(0, 19) // Max 16 digits + 3 spaces
}

/**
 * Format expiry date (MM/YY)
 */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length >= 2) {
    return digits.substring(0, 2) + '/' + digits.substring(2, 4)
  }

  return digits
}

/**
 * Get card brand from number
 */
export function getCardBrand(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')

  if (/^4/.test(digits)) return 'visa'
  if (/^5[1-5]/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^6(?:011|5)/.test(digits)) return 'discover'

  return 'unknown'
}

/**
 * Mask card number (show only last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')
  const lastFour = digits.slice(-4)
  const masked = digits.slice(0, -4).replace(/\d/g, '*')
  return masked + lastFour
}
