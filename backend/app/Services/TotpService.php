<?php

namespace App\Services;

class TotpService
{
    /**
     * Base32 character set mapping.
     */
    private static $base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Generate a random 16-character Base32 secret key.
     *
     * @return string
     */
    public static function generateSecret(): string
    {
        $secret = '';
        for ($i = 0; $i < 16; $i++) {
            $secret .= self::$base32Chars[random_int(0, 31)];
        }
        return $secret;
    }

    /**
     * Decode a Base32 string to binary.
     *
     * @param string $base32
     * @return string
     */
    public static function base32Decode(string $base32): string
    {
        $base32 = strtoupper($base32);
        $base32 = rtrim($base32, '=');
        $binaryString = '';

        foreach (str_split($base32) as $char) {
            $pos = strpos(self::$base32Chars, $char);
            if ($pos === false) {
                continue; // Skip invalid chars
            }
            $binaryString .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $bytes = [];
        foreach (str_split($binaryString, 8) as $byte) {
            if (strlen($byte) === 8) {
                $bytes[] = chr(bindec($byte));
            }
        }

        return implode('', $bytes);
    }

    /**
     * Verify a 6-digit TOTP code against a secret key.
     *
     * @param string $secret
     * @param string $code
     * @param int $discrepancy Allowed time windows (clock drift) in steps of 30 seconds
     * @return bool
     */
    public static function verifyCode(string $secret, string $code, int $discrepancy = 1): bool
    {
        $decodedSecret = self::base32Decode($secret);
        $currentTime = time();
        $timeStep = 30;

        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $step = floor($currentTime / $timeStep) + $i;
            
            // Pack step into 8-byte binary string (big-endian)
            $timeBinary = pack('N*', 0) . pack('N*', $step);

            $hmac = hash_hmac('sha1', $timeBinary, $decodedSecret, true);
            $offset = ord($hmac[19]) & 0xf;

            $totp = (
                ((ord($hmac[$offset]) & 0x7f) << 24) |
                ((ord($hmac[$offset + 1]) & 0xff) << 16) |
                ((ord($hmac[$offset + 2]) & 0xff) << 8) |
                (ord($hmac[$offset + 3]) & 0xff)
            ) % 1000000;

            if (sprintf('%06d', $totp) === strval($code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate standard otpauth URL for Google Authenticator.
     *
     * @param string $email
     * @param string $secret
     * @return string
     */
    public static function getQrCodeUrl(string $email, string $secret): string
    {
        $issuer = rawurlencode('ESSS Science Portal');
        $account = rawurlencode($email);
        return "otpauth://totp/{$issuer}:{$account}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
    }
}
