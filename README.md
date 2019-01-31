# Human-Connection Nitro | Deployment Configuration

> Currently the deployment is not primetime ready as you still have to do some manual work. That we need to change, the following list gives some glimpse of the missing steps.

## Todo`s
- [ ] check labels and selectors if they all are correct
- [ ] configure NGINX from yaml
- [ ] configure Let's Encrypt cert-manager from yaml
- [ ] configure ingress form yaml
- [ ] configure persistent & shared storage between nodes
- [ ] reproduce setup locally

> The dummy directory has some lb configurations that did not work properly on Digital Ocean but could be used as a starting point for getting it right

## Install Minikube, kubectl
There are many Kubernetes distributions, but if you're just getting started, Minikube is a tool that you can use to get your feet wet.

[Install Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/)

## Create a namespace locally
```shell
kubectl create -f namespace-staging.json
```

## Change config maps according to your needs
```shell
cd ./staging
cp db-migration-worker-configmap.template.yaml db-migration-worker-configmap.yaml
# edit all variables according to the setup of the remote legacy server
```

## Apply the config map to staging namespace
```shell
cd ./staging
kubectl apply -f neo4j-configmap.yaml -f backend-configmap.yaml -f web-configmap.yaml -f db-migration-worker-configmap.yaml
```

## Setup secrets and deploy themn
```shell
cd ./staging
cp secrets.yaml.template secrets.yaml
# change all vars as needed and deploy it afterwards
kubectl apply -f secrets.yaml
```

## Deploy the app
```shell
cd ./staging
kubectl apply -f ./volumes
kubectl apply -f neo4j-deployment.yaml -f backend-deployment.yaml -f web-deployment.yaml -f db-migration-worker-deployment.yaml
```
This can take a while.
Sit back and relax and have a look into your minikube dashboard:
```
minikube dashboard
```
Wait until all pods turn green and they don't show a warning `Waiting: ContainerCreating` anymore.

## Expose the services

```shell
kubectl create -f services/
```

## Access the service

```shell
minikube service nitro-backend --namespace=staging
minikube service nitro-web     --namespace=staging
```


## Provisioning db-migration-worker
Copy your private ssh key and the `.known-hosts` file of your remote legacy server.
```shell

# check the corresponding db-migration-worker pod
kubectl --namespace=staging get pods
# change <POD_ID> below
kubectl cp path/to/your/ssh/keys/folder staging/nitro-db-migration-worker-<POD_ID>:/root/
```

Run the migration:
```shell
# change <POD_ID> below
kubectl --namespace=staging exec -it nitro-db-migration-worker-<POD_ID> ./import.sh
```
