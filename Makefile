.PHONY: dev build start deploy

dev:
	npx next dev

build:
	npx next build

start:
	npx next start

deploy:
	vercel --prod
