provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

resource "kubernetes_namespace" "nomad_crew" {
  metadata {
    name = "nomad-crew"
  }
}

resource "kubernetes_deployment" "nomad_crew_frontend" {
  metadata {
    name      = "nomad-crew-frontend"
    namespace = kubernetes_namespace.nomad_crew.metadata[0].name
    labels = {
      app = "nomad-crew-frontend"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "nomad-crew-frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "nomad-crew-frontend"
        }
      }

      spec {
        container {
          image = var.docker_image != "" ? var.docker_image : "${aws_ecr_repository.nomad_crew_frontend.repository_url}:latest"
          name  = "nomad-crew-frontend"
          
          port {
            container_port = 80
          }

          env {
            name  = "EXPO_PUBLIC_SUPABASE_ANON_KEY"
            value = var.supabase_anon_key
          }
          
          env {
            name  = "EXPO_PUBLIC_SUPABASE_URL"
            value = var.supabase_url
          }
          
          env {
            name  = "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"
            value = var.google_web_client_id
          }
          
          env {
            name  = "EXPO_PUBLIC_GOOGLE_PLACES_API_KEY"
            value = var.google_places_api_key
          }

          resources {
            limits = {
              cpu    = "0.5"
              memory = "512Mi"
            }
            requests = {
              cpu    = "0.25"
              memory = "256Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "nomad_crew_frontend" {
  metadata {
    name      = "nomad-crew-frontend"
    namespace = kubernetes_namespace.nomad_crew.metadata[0].name
  }
  spec {
    selector = {
      app = kubernetes_deployment.nomad_crew_frontend.metadata[0].labels.app
    }
    port {
      port        = 80
      target_port = 80
    }
    type = "LoadBalancer"
  }
}

output "kubernetes_service_endpoint" {
  description = "The endpoint for the Kubernetes service"
  value       = kubernetes_service.nomad_crew_frontend.status[0].load_balancer[0].ingress[0].hostname
} 