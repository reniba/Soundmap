# API Web — Backend para Aplicação Web

API REST para a plataforma web de monitoramento de ruído. Fornece endpoints para autenticação de usuários, gerenciamento de áreas, consulta de medições de decibéis em tempo real, e visualização de mapas de intensidade sonora.

---

## Arquitetura

```
index.ts (ponto de entrada)
  │
  ├── User.routes          — Autenticação (sign-up, login)
  ├── Area.routes          — CRUD de áreas de monitoramento
  ├── Measure.routes       — Consulta de medições históricas
  ├── Map.routes           — Dados para mapa em tempo real
  ├── Sensor.routes        — Gerenciamento de sensores
  │
  ├── controllers/         — Lógica de negócio por rota
  ├── repositories/        — Acesso a dados (PostgreSQL + Redis)
  ├── middlewares/         — Autenticação JWT, tratamento de erros
  └── schemas/             — Validação com Zod
```

---

## Credenciais

| Parâmetro | Valor |
|---|---|
| Host | `0.0.0.0` |
| Porta | `4344` |

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_HOST` | `soundmap_db` | Host do PostgreSQL |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_NAME` | `soundmap` | Nome do banco de dados |
| `DB_USER` | `admin_g4` | Usuário do banco |
| `DB_PASSWORD` | `admin_g4` | Senha do banco |
| `REDIS_HOST` | `redis` | Host do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `JWT_SECRET` | `your-secret-key` | Chave para assinar tokens JWT |

---

## Estrutura de arquivos

```
api_web_app/
├── Dockerfile           # Imagem Docker (Node.js + TypeScript)
├── package.json         # Dependências
├── tsconfig.json        # Configuração TypeScript
├── init.sql            # Schema de banco (tabelas auxiliares)
└── src/
    ├── index.ts        # Inicialização da aplicação
    ├── @types/         # Tipos globais
    ├── controllers/    # Handlers de requisição
    ├── database/       # Conexões (PostgreSQL, Redis)
    ├── errors/         # Classes de erro customizadas
    ├── middlewares/    # auth.ts, errorHandler.ts
    ├── repositories/   # Queries ao banco
    ├── routes/         # Definição de endpoints
    └── schemas/        # Validação de input (Zod)
```

---

## Autenticação

Todos os endpoints exceto `/user/signUp` e `/user/login` requerem um token JWT no header `Authorization`:

```
Authorization: Bearer <token>
```

O token é gerado no login com duração configurável. O middleware `auth.ts` valida e decodifica o token, adicionando os dados do usuário ao contexto da requisição.

---

## Endpoints

### Usuários (`/user`)

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| POST | `/user/signUp` | ✗ | Criar novo usuário (email, username, senha) |
| POST | `/user/login` | ✗ | Autenticar e obter JWT |
| GET | `/user` | ✓ | Obter informações do usuário autenticado |

#### `POST /user/signUp`

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "username": "meuuser",
  "password": "minimo6"
}
```

**Retorno `200`:**
```json
{ "message": "Usuário cadastrado" }
```

---

#### `POST /user/login`

**Body (JSON):**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "minhasenha"
}
```

**Retorno `200`:**
```json
{ "token": "<JWT>" }
```

---

#### `GET /user`

Sem query/body.

**Retorno `200`:**
```json
{
  "username": "meuuser",
  "email": "user@example.com"
}
```

---

### Áreas (`/area`)

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| GET | `/area` | ✓ | Listar todas as áreas do usuário |
| POST | `/area` | ✓ | Criar nova área (nome, coordenadas, sensores associados) |
| DELETE | `/area` | ✓ | Deletar uma área |

#### `GET /area`

Sem query/body.

**Retorno `200`:**
```json
{
  "areas": [
    {
      "id": 1,
      "name": "Campus USP",
      "url": "https://...",
      "latitude": -23.55,
      "longitude": -46.63
    }
  ]
}
```

---

#### `POST /area`

**Body (JSON):**
```json
{
  "name": "Campus USP",
  "latitude": -23.55,
  "longitude": -46.63,
  "url": "https://..."
}
```

**Retorno `200`:**
```json
{ "message": "Área criada com sucesso" }
```

---

#### `DELETE /area`

**Query param:**
```
?areaId=1
```

**Retorno `200`:** texto `Área deletada com sucesso`

---

### Medições (`/measure`)

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| GET | `/measure` | ✓ | Consultar histórico de medições (filtro por período, area) |

#### `GET /measure`

**Query params:**

| Param | Tipo | Obrigatório | Padrão |
|---|---|---|---|
| `areaId` | number | Sim | — |
| `sensorId` | number | Não | — |
| `sensorName` | string | Não | — |
| `windowStart` | date | Não | 1 hora atrás |
| `windowEnd` | date | Não | agora |

**Retorno `200`:**
```json
{
  "measures": [
    {
      "dbAvg": 65.3,
      "dbMax": 80.1,
      "latitude": -23.55,
      "longitude": -46.63,
      "windowStart": "2026-06-01T10:00:00Z",
      "windowEnd": "2026-06-01T10:05:00Z"
    }
  ]
}
```

---

### Mapa (`/map`)

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| GET | `/map` | ✓ | Dados em tempo real do mapa (intensidade por localização) |

#### `GET /map`

**Query param:**
```
?areaId=1
```

**Retorno `200`:**
```json
{
  "areaId": 1,
  "sensors": [
    {
      "id": 3,
      "name": "sensor-abc",
      "active": true,
      "dbAverage": 72.5,
      "latitude": -23.55,
      "longitude": -46.63
    }
  ],
  "appSensors": [
    {
      "sensorId": "app-test-01",
      "name": "aplicativo app-test-01",
      "active": true,
      "dbAverage": 68.4,
      "latitude": -23.55,
      "longitude": -46.63
    }
  ]
}
```

| Campo em `sensors` | Tipo | Descrição |
|---|---|---|
| `id` | `number` | ID numérico do sensor |
| `name` | `string` | Nome do sensor |
| `active` | `boolean` | `true` se a última medição ocorreu há menos de 1 minuto (dado do Redis) |
| `dbAverage` | `number` | Média de decibéis da última janela de processamento |
| `latitude` | `number` | Latitude do sensor |
| `longitude` | `number` | Longitude do sensor |

| Campo em `appSensors` | Tipo | Descrição |
|---|---|---|
| `sensorId` | `string` | ID do sensor reportado pelo app |
| `name` | `string` | Identificador legível no formato `"aplicativo {sensorId}"` |
| `active` | `boolean` | `true` se a última medição ocorreu há menos de 1 minuto (dado do Redis) |
| `dbAverage` | `number` | Média de decibéis da última janela de processamento |
| `latitude` | `number` | Latitude da medição |
| `longitude` | `number` | Longitude da medição |

> `appSensors` são populados exclusivamente via Redis com chave `app:{userId}:{areaId}:{sensorId}`. Não há fallback no PostgreSQL.

---

### Sensores (`/sensor`)

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| GET | `/sensor` | ✓ | Listar sensores cadastrados |
| GET | `/sensor/last-state` | ✓ | Último estado de um sensor (Redis com fallback no banco) |
| POST | `/sensor` | ✓ | Registrar novo sensor |
| DELETE | `/sensor` | ✓ | Deletar um sensor |
| PUT | `/sensor` | ✓ | Associar sensor a uma área |

#### `GET /sensor`

**Query params (todos opcionais):**

| Param | Tipo | Descrição |
|---|---|---|
| `sensorId` | number | Filtra por ID |
| `sensorName` | string | Filtra por nome (busca parcial) |
| `activeInArea` | boolean (`"true"`/`"false"`) | Filtra por status ativo na área |
| `areaId` | number | Filtra por área |
| `areaName` | string | Filtra por nome da área (busca parcial) |

**Retorno `200`:**
```json
{
  "sensors": [
    {
      "id": 3,
      "name": "sensor-abc",
      "areaId": 1,
      "areaName": "Campus USP",
      "activeInArea": true,
      "originId": 7
    }
  ]
}
```

---

#### `GET /sensor/last-state`

Retorna o último estado conhecido de um sensor: nome, status de atividade e dados da última medição. Consulta primeiro o Redis; se a chave não existir, faz fallback no PostgreSQL buscando a medição mais recente.

**Query param:**
```
?sensorId=1
```

**Retorno `200`:**
```json
{
  "name": "sensor_0",
  "active": true,
  "dbAverage": 56.3,
  "latitude": -22.006,
  "longitude": -47.897
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | `string` | Nome do sensor |
| `active` | `boolean` | `true` se a última medição ocorreu há menos de 1 hora |
| `dbAverage` | `number` | Média de decibéis da última janela de processamento |
| `latitude` | `number` | Latitude da localização do sensor |
| `longitude` | `number` | Longitude da localização do sensor |

**Retorno `404`** se nenhuma medição for encontrada no Redis nem no banco para o sensor informado.

---

#### `POST /sensor`

**Body (JSON):**
```json
{
  "name": "sensor-novo",
  "areaId": 1
}
```

**Retorno `201`:**
```json
{ "message": "Sensor criado com sucesso" }
```

---

#### `DELETE /sensor`

**Query param:**
```
?sensorId=3
```

**Retorno `200`:**
```json
{ "message": "Sensor deletado com sucesso" }
```

---

#### `PUT /sensor`

Move/associa um sensor a uma área e define se está ativo.

**Body (JSON):**
```json
{
  "sensorId": 3,
  "areaId": 2,
  "activeInArea": true
}
```

> `activeInArea` é opcional, padrão `false`.

**Retorno `200`:**
```json
{ "message": "Operação realizada com sucesso" }
```

---

## Dependências

- **Express.js** — framework web
- **TypeScript** — tipagem estática
- **pg** — driver PostgreSQL
- **redis** — cliente Redis
- **jsonwebtoken** — geração e validação de JWT
- **bcrypt** — hash de senhas
- **zod** — validação de schemas

---

## Persistência

- **PostgreSQL:** dados de usuários, áreas, sensores e histórico de medições
- **Redis:** cache de dados de mapa em tempo real para reduzir latência nas consultas

---

## Estrutura de chaves no Redis

A API consome duas chaves Redis, populadas pelo serviço de processamento (Spark). A ausência de uma chave faz a API buscar o dado no PostgreSQL como fallback.

### `area:{areaId}` — lista de sensores ativos da área

Array JSON com os IDs dos sensores ativos naquela área.

```json
[1, 2, 3]
```

### `sensor:{sensorId}` — dados do sensor para o mapa

Objeto JSON com os campos do sensor, **sem o `id`** (que está na própria chave).

```json
{
  "name": "sensor-abc",
  "dbAverage": 72.5,
  "latitude": -23.550651,
  "longitude": -46.633382,
  "windowEnd": "2026-05-31T10:30:00Z"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | `string` | Nome do sensor |
| `dbAverage` | `number` | Média de decibéis da última janela de processamento |
| `latitude` | `number` | Latitude da localização do sensor (-90 a 90) |
| `longitude` | `number` | Longitude da localização do sensor (-180 a 180) |
| `windowEnd` | `string` (ISO 8601 UTC) | Fim da janela de tempo do processamento — usado para calcular se o sensor ainda está ativo |

> `windowEnd` deve ser enviado com timezone explícito (`Z` ou `+00:00`) para evitar ambiguidade na comparação com o horário atual da API.

### `app:{userId}:{areaId}:{sensorId}` — medição do app para o mapa em tempo real

Objeto JSON com os dados agregados da última janela de processamento enviada pelo aplicativo móvel. A chave composta permite buscar todas as medições de uma área via `SCAN app:{userId}:{areaId}:*`.

```json
{
  "name": "aplicativo 42",
  "dbAverage": 68.4,
  "latitude": -23.550651,
  "longitude": -46.633382,
  "windowEnd": "2026-06-05T14:00:00Z"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | `string` | Identificador legível no formato `"aplicativo {sensorId}"` |
| `dbAverage` | `number` | Média logarítmica de decibéis da última janela de processamento |
| `latitude` | `number` | Latitude da medição (-90 a 90) |
| `longitude` | `number` | Longitude da medição (-180 a 180) |
| `windowEnd` | `string` (ISO 8601 UTC) | Fim da janela de processamento |

> Os segmentos da chave (`userId`, `areaId`, `sensorId`) são inteiros.

### Ciclo de vida das chaves

| Evento | Efeito no Redis |
|---|---|
| Sensor deletado | `sensor:{id}` e `area:{areaId}` são removidos |
| Sensor movido de área (`putSensorInArea`) | `area:{areaId}` da área antiga e nova são removidos (fallback ao banco na próxima leitura) |
| Primeira leitura do mapa sem cache | `area:{areaId}` é populado a partir do PostgreSQL |

---

## Build e execução

```bash
# Desenvolvimento
npm run dev      # com hot-reload (tsx watch)

# Produção
npm run build    # transpila para dist/
npm start        # executa dist/index.js
```
