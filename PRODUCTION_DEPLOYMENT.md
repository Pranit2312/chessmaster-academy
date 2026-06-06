# Production Deployment Guide

## Chess Learning Ecosystem - Production Deployment

### Prerequisites
- Kubernetes cluster (v1.24+)
- Docker Registry (Docker Hub, ECR, or private)
- kubectl configured
- Domain names configured
- SSL certificates ready
- MongoDB Atlas or self-hosted MongoDB
- Redis instance

### Step 1: Prepare Docker Images

```bash
# Build backend image
docker build -t your-registry/chess-ecosystem-backend:latest .
docker push your-registry/chess-ecosystem-backend:latest

# Build frontend image
cd client
docker build -t your-registry/chess-ecosystem-frontend:latest .
docker push your-registry/chess-ecosystem-frontend:latest
```

### Step 2: Create Kubernetes Secrets

```bash
# Create namespace
kubectl create namespace chess-ecosystem

# Create secrets
kubectl create secret generic chess-ecosystem-secrets \
  --from-literal=mongodb-uri='mongodb+srv://user:pass@cluster.mongodb.net/chess-ecosystem' \
  --from-literal=jwt-secret='your-jwt-secret-key' \
  --from-literal=razorpay-key-id='your-razorpay-key-id' \
  --from-literal=razorpay-key-secret='your-razorpay-key-secret' \
  --from-literal=razorpay-public-key='your-razorpay-public-key' \
  -n chess-ecosystem
```

### Step 3: Deploy to Kubernetes

```bash
# Create ConfigMaps (optional)
kubectl create configmap chess-ecosystem-config \
  --from-literal=NODE_ENV=production \
  -n chess-ecosystem

# Deploy backend
kubectl apply -f kubernetes/backend-deployment.yml -n chess-ecosystem
kubectl apply -f kubernetes/backend-service.yml -n chess-ecosystem

# Deploy frontend
kubectl apply -f kubernetes/frontend-deployment.yml -n chess-ecosystem
kubectl apply -f kubernetes/frontend-service.yml -n chess-ecosystem

# Deploy ingress
kubectl apply -f kubernetes/ingress.yml -n chess-ecosystem
```

### Step 4: Verify Deployment

```bash
# Check pod status
kubectl get pods -n chess-ecosystem

# Check services
kubectl get svc -n chess-ecosystem

# Check ingress
kubectl get ingress -n chess-ecosystem

# View logs
kubectl logs -f deployment/chess-ecosystem-backend -n chess-ecosystem
```

### Step 5: Setup SSL/TLS

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Step 6: Scaling

```bash
# Scale backend to 5 replicas
kubectl scale deployment chess-ecosystem-backend --replicas=5 -n chess-ecosystem

# Auto-scaling with HPA
kubectl autoscale deployment chess-ecosystem-backend \
  --min=3 --max=10 --cpu-percent=80 -n chess-ecosystem
```

### Step 7: Monitoring

```bash
# Setup Prometheus and Grafana (optional)
# Add monitoring annotations to deployments
# Configure alerts for critical metrics
```

### Step 8: Backup and Recovery

```bash
# Regular backups
- MongoDB: Use MongoDB Atlas automated backups
- Code: Use GitHub for version control
- Database snapshots: Daily at 2 AM UTC
- Recovery testing: Weekly
```

### Troubleshooting

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n chess-ecosystem
kubectl logs <pod-name> -n chess-ecosystem
```

**Service connectivity issues:**
```bash
kubectl get endpoints -n chess-ecosystem
kubectl exec -it <pod-name> -n chess-ecosystem -- /bin/sh
```

**Ingress not working:**
```bash
kubectl describe ingress chess-ecosystem-ingress -n chess-ecosystem
```

### Performance Optimization

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Pod Disruption Budgets**: Define minimum availability
3. **Horizontal Pod Autoscaler**: Scale based on metrics
4. **Vertical Pod Autoscaler**: Optimize resource requests
5. **Network Policies**: Restrict traffic between pods

### Security Hardening

1. Enable Pod Security Policies
2. Use Network Policies
3. Enable RBAC
4. Scan images for vulnerabilities
5. Use private container registry
6. Enable audit logging

### Maintenance

- Monthly security updates
- Quarterly performance reviews
- Weekly backup verification
- Daily log monitoring

---

**Last Updated:** June 2026
**Maintained By:** DevOps Team
