FRONTEND_DIR=frontend
BACKEND_DIR=backend

.PHONY: build start_all next flask kill

build:
	cd $(FRONTEND_DIR) && npm i
	cd $(BACKEND_DIR) && pip install -r requirements.txt

next:
	cd $(FRONTEND_DIR) && npm run dev
	
flask:
	cd $(BACKEND_DIR) && FLASK_APP=run.py flask run

startall:
	$(MAKE) next & $(MAKE) flask

kill:
	@PORTS="3000 3001 3002 3003 3004 3005 3006 3007 3008 3009"; \
	for PORT in $$PORTS; do \
		PIDS=$$(lsof -t -i :$$PORT); \
		if [ -n "$$PIDS" ]; then \
			echo "Killing PIDs for port $$PORT: $$PIDS"; \
			for PID in $$PIDS; do \
				kill -9 $$PID; \
			done; \
		fi; \
	done