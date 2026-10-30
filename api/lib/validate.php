<?php
declare(strict_types=1);

const COURSES = ['SCM', 'LCM'];
const LEVELS  = ['Club', 'Regional', 'State', 'National', 'International', 'Other'];
const ROUNDS  = ['Heat', 'Semi-final', 'Final', 'Time trial'];

function json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw === false ? '' : $raw, true);
    if (!is_array($data)) {
        send_json(['error' => 'Invalid JSON body'], 400);
    }
    return $data;
}

function validation_failed(array $errors): never
{
    send_json(['error' => 'Validation failed', 'fields' => $errors], 422);
}

/** Writes need the shared secret that only the Next.js server knows. */
function require_write_key(): void
{
    $expected = config('API_WRITE_KEY');
    $given = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($expected === false || $expected === '' || !hash_equals($expected, (string) $given)) {
        send_json(['error' => 'Unauthorized'], 401);
    }
}

function clean_str(array $d, string $k, int $max, array &$errors, bool $required = false): ?string
{
    $v = $d[$k] ?? null;
    if ($v !== null && !is_string($v)) {
        $errors[$k] = 'Must be text';
        return null;
    }
    $v = $v === null ? '' : trim($v);
    if ($v === '') {
        if ($required) {
            $errors[$k] = 'Required';
        }
        return null;
    }
    if (mb_strlen($v) > $max) {
        $errors[$k] = "Max $max characters";
        return null;
    }
    return $v;
}

function clean_date(array $d, string $k, array &$errors, bool $required = false): ?string
{
    $v = clean_str($d, $k, 10, $errors, $required);
    if ($v === null) {
        return null;
    }
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m)
        || !checkdate((int) $m[2], (int) $m[3], (int) $m[1])) {
        $errors[$k] = 'Use a valid date (YYYY-MM-DD)';
        return null;
    }
    return $v;
}

function clean_enum(array $d, string $k, array $allowed, array &$errors, ?string $default = null): ?string
{
    $v = clean_str($d, $k, 30, $errors);
    if ($v === null) {
        return $default;
    }
    if (!in_array($v, $allowed, true)) {
        $errors[$k] = 'Invalid value';
        return null;
    }
    return $v;
}

/** Whole number in [$min, $max], or null (sets an error if present but invalid). */
function clean_int(array $d, string $k, int $min, int $max, array &$errors, bool $required = false): ?int
{
    $v = $d[$k] ?? null;
    if ($v === null || $v === '') {
        if ($required) {
            $errors[$k] = 'Required';
        }
        return null;
    }
    if (!is_numeric($v) || (float) $v != floor((float) $v) || $v < $min || $v > $max) {
        $errors[$k] = "Must be a whole number from $min to $max";
        return null;
    }
    return (int) $v;
}
