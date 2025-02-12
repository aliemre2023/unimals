FRONTEND_DIR=frontend
BACKEND_DIR=backend

.PHONY: build start_all next flask

build:
	cd $(FRONTEND_DIR) && npm i
	cd $(BACKEND_DIR) && pip install -r requirements.txt

next:
	cd $(FRONTEND_DIR) && npm run dev
	
flask:
	cd $(BACKEND_DIR) && FLASK_APP=run.py flask run

startall:
	$(MAKE) next & $(MAKE) flask