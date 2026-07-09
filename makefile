# Variáveis para facilitar manutenção
COMPOSE = docker compose -f docker-compose.yml

# O default faz com que, ao digitar apenas "make", ele mostre a lista de comandos
.DEFAULT_GOAL := help

help:
	@echo "Comandos disponíveis:"
	@echo "  make build      - Constrói as imagens (usa o cache nativo do Docker)"
	@echo "  make build-nc   - Constrói as imagens do ZERO (ignora o cache)"
	@echo "  make up         - Sobe os containers em background"
	@echo "  make up-build   - Constrói e sobe os containers de uma vez"
	@echo "  make down       - Derruba os containers e a rede"
	@echo "  make restart    - Reinicia o ambiente (down + up)"
	@echo "  make logs       - Mostra os logs em tempo real (ctrl+c para sair)"
	@echo "  make ps         - Lista os containers ativos deste projeto"
	@echo "  make clean      - Derruba containers e APAGA VOLUMES (Cuidado: apaga dados do Kafka/Postgres)"

build:
	$(COMPOSE) build

build-nc:
	$(COMPOSE) build --no-cache

up: 
	$(COMPOSE) up -d

up-build:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

restart: down up

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v --remove-orphans

# Declaração dos comandos que não são arquivos físicos
.PHONY: help build build-nc up up-build down restart logs ps clean
