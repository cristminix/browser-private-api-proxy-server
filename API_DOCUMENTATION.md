# Dokumentasi Endpoint Browser Private API Proxy Server

Berikut adalah dokumentasi lengkap untuk semua endpoint yang tersedia di Browser Private API Proxy Server.

## Server Configuration

- **Default Port**: 4001 (dapat diubah dengan environment variable PORT)
- **Base URL**: `http://localhost:4001`

## REST API Endpoints

### 1. Status Server

- **Endpoint**: `GET /api/status`
- **Deskripsi**: Mengecek status server
- **Response**:

```json
{
  "status": "success",
  "message": "Browser Private API Proxy Server is running",
  "timestamp": "2023-11-19T15:27:29.741Z"
}
```

### 2. Fake Stream Chat

- **Endpoint**: `GET /api/fake-stream-chat`
- **Deskripsi**: Mengembalikan stream chat palsu untuk tujuan testing
- **Response**: Server-Sent Events (SSE) dengan format:

```
data: {"type":"chat:completion","data":{"delta_content":"","phase":"answer"}}
data: {"type":"chat:completion","data":{"usage":{"prompt_tokens":27,"completion_tokens":1432,"total_tokens":1459,"prompt_tokens_details":{"cached_tokens":0},"words":2838},"phase":"other"}}
...
```

### 3. Chat (GET)

- **Endpoint**: `GET /api/chat`
- **Parameter Query**: `prompt` (opsional, default: "What is the capital of france")
- **Deskripsi**: Mengirim pertanyaan chat melalui Socket.IO
- **Response**:

```json
{
  "success": true,
  "data": {
    // Response data dari chat handler
  }
}
```

### 4. Chat (POST)

- **Endpoint**: `POST /api/chat`
- **Request Body**:

```json
{
  "prompt": "Pertanyaan Anda di sini"
}
```

- **Deskripsi**: Mengirim pertanyaan chat melalui Socket.IO dengan metode POST
- **Response**:

```json
{
  "success": true,
  "data": {
    // Response data dari chat handler
  }
}
```

### 5. Reload Chat

- **Endpoint**: `GET /api/reload-chat`
- **Deskripsi**: Me-reload ulang chat handler
- **Response**:

```json
{
  "success": true
}
```

### 6. Proxy

- **Endpoint**: `POST /api/proxy`
- **Request Body**: Data JSON apa pun yang akan diteruskan
- **Deskripsi**: Endpoint proxy untuk meneruskan request ke API target
- **Response**:

```json
{
  "status": "success",
  "message": "Proxy request received",
  "originalRequest": {
    // Data request asli
  }
}
```

## OpenAI Compatible API Endpoints

### 1. List Models

- **Endpoint**: `GET /v1/models`
- **Deskripsi**: Mendapatkan daftar model yang tersedia
- **Response**:

```json
{
  "type": "list",
  "data": [
    {
      "model": "glm-4.6",
      "id": "glm-4.6",
      "alias": "glm-4.6",
      "provider": "zai"
    }
  ]
}
```

### 2. Chat Completions

- **Endpoint**: `POST /v1/chat/completions`
- **Request Body**: Format request yang kompatibel dengan OpenAI API
- **Deskripsi**: Endpoint untuk chat completions yang kompatibel dengan OpenAI API
- **Response**: Response yang kompatibel dengan OpenAI API

## Socket.IO Events

### Connection Events

- **Connection**: Client terhubung ke server
- **Disconnect**: Client terputus dari server

### Client to Server Events

- **answer**: Menerima jawaban dari client
- **message**: Mengirim pesan ke server dengan format:

```json
{
  "type": "message_type",
  "data": {
    // Data pesan
  }
}
```

- **heartbeat**: Mengirim heartbeat dengan format:

```json
{
  "appName": "nama_aplikasi"
}
```

### Server to Client Events

- **connected**: Dikirim saat client berhasil terhubung
- **heartbeat**: Dikirim setiap 5 detik untuk menjaga koneksi
- **message**: Mengirim pesan ke client dengan format:

```json
{
  "type": "message_type",
  "data": {
    // Data pesan
  }
}
```

## Message Types

### API Request

```json
{
  "type": "api_request",
  "requestId": "unique_request_id",
  "payload": {
    // Data request
  }
}
```

### API Response

```json
{
  "type": "api_response",
  "requestId": "unique_request_id",
  "payload": {
    // Data response
  }
}
```

### Ping/Pong

- **Ping**:

```json
{
  "type": "ping"
}
```

- **Pong**:

```json
{
  "type": "pong",
  "timestamp": 1234567890
}
```

## Error Handling

Semua endpoint akan mengembalikan response error dengan format yang konsisten:

```json
{
  "error": "Deskripsi error"
}
```

## CORS

Server mengaktifkan CORS untuk semua route dengan konfigurasi default:

- Origin: `*` (semua origin diizinkan)
- Methods: GET, POST, PUT, DELETE, OPTIONS

## Streaming

Endpoint `/api/fake-stream-chat` dan `/v1/chat/completions` mendukung respons streaming menggunakan Server-Sent Events (SSE).
