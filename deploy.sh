current_deployment=$(clasp deployments | tail -n1 | cut -d' ' -f2)
clasp deploy --deploymentId "${current_deployment}"