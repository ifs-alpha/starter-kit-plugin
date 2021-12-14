# Upgrade Container Molecule from 0.16.0 to 0.17.0

### Context

Following IBM lifecycle products and platform backlog. This document allows you to migrate from 0.16.0 to 0.17.0 version

### Linked Issues


- [PLAT-340](https://ifsalpha.atlassian.net/browse/PLAT-340): Remove domain settings object from cis atom
- [PLAT-471](https://ifsalpha.atlassian.net/browse/PLAT-471): Add ability to allow force-delete option on cos bucket
- [PLAT-701](https://ifsalpha.atlassian.net/browse/PLAT-701): Add ability to block traffic from specific list of countries
- [PLAT-1008](https://ifsalpha.atlassian.net/browse/PLAT-1008): Remove CMS provisionned by LZ integration
- [PLAT-1085](https://ifsalpha.atlassian.net/browse/PLAT-1085): Allow top level domain dns records , ip firewalls and rate limits configuration
- [PLAT-1122](https://ifsalpha.atlassian.net/browse/PLAT-1122): Default version of IKS is 1.21
- [PLAT-1046](https://ifsalpha.atlassian.net/browse/PLAT-1046): Extract k8sconfig / adapt ROKS


### Functional impact

These new features impact the json model for container deployment following as:

- remove ability to customize domain settings (min_tls_version). Domain settings configuration is now assumed only by landingzone.
- remove the integration with CMS and certificate provided by the LandingZone. Rely on provided managed certificate for IKS.
- domains block in cluster_info block moves at the root of json file.
- Add the ability to enable forcing the deletion of non empty buckets. Accepted values: `true` or `false`
- Add ability to block traffic from specific list of countries. Accepted value is a list of countries. Here is an example :`["IR","SY","SD","CU","SS"]`
- Allow top level domain configuration via a special key  `self` on the subdomains  input 

##### Actual JSON model

````json
{
  "landing_zone_cms_instance_name": "your_instance_name",
  "cluster_info": {
    "min_tls_version": "1.2", # Compliant version are actually 1.2 and 1.3 (default version is 1.3)
    "domains": {
       "skt-integration.ibm.ifsalpha.com": {
        "subdomains": {
           "subdomain1": {
              "rate_limiting_rule": {
                 "methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "HEAD"
                 ],
                 "threshold": 20,
                 "period": 900,
                 "timeout": 43200,
                 "response_type": "text/plain",
                 "response_body": "custom response body"
              },
              "ingress_authorized_ips": [
                 "0.0.0.0/0",
                 "::/0"
              ]
           }
        }
       }
    }
  }, 
   "cos_instance_info": {
      "buckets": {
      "BUCKET_NAME": {
        "storage_class": "standard"
      }
    }
   }
}
````

##### New JSON model

````json
{
  "cluster_info": {
  },
  "domains": {
     "skt-integration.ibm.ifsalpha.com": {
        "subdomains": {
           "self": {
              "rate_limiting_rule": {
                 "methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "HEAD"
                 ],
                 "threshold": 20,
                 "period": 900,
                 "timeout": 43200,
                 "response_type": "text/plain",
                 "response_body": "custom response body"
              },
              "ingress_authorized_ips": [
                 "0.0.0.0/0",
                 "::/0"
              ]
           },
           "subdomain1": {
              "rate_limiting_rule": {
                 "methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "PATCH",
                    "HEAD"
                 ],
                 "threshold": 20,
                 "period": 900,
                 "timeout": 43200,
                 "response_type": "text/plain",
                 "response_body": "custom response body"
              },
              "ingress_authorized_ips": [
                 "0.0.0.0/0",
                 "::/0"
              ]
           }
        }
     }
  }, 
   "cos_instance_info": {
      "buckets": {
      "BUCKET_NAME": {
        "storage_class": "standard",
         "force_delete": false
      }
    }
   }, 
   "cis_instance_info": {
        "blocked_countries": ["IR","SY","SD","CU","SS"]
   }
}

````

#### bivwak/utils-orb@0.0.X

#### Migration job for level 1 usage

This new job was embedded in starterkits orb to easy you migration. This job can only be used as is by level 1 starterkits 
usage and have to be customized to be compliant to others usages

This job allow to be compliant container molecule 0.17.0


````
    migrate_container:
        description: |
            "migrate container molecule"
        executor:
            image: << parameters.executor_image_name >>
            name: artifactory
            tag: << parameters.executor_image_tag >>
        parameters:
            executor_image_name:
                default: ifsalpha-pipeline-docker-release-local.jfrog.io/deploy/platform-ibm
                description: image name for executor if not default one
                type: string
            executor_image_tag:
                default: stable
                description: image version for executor if not default one
                type: string
            path_vars:
                type: string
            source_artifactory_repo:
                default: release
                description: The artifactory repo of the source version of the container molecule
                type: string
            source_version:
                default: 0.16.0
                description: The source version of the container molecule to migrate
                type: string
            target_artifactory_repo:
                default: release
                description: The artifactory repo of the target version of the container molecule
                type: string
            target_version:
                default: 0.17.0
                description: The target version of the container molecule
                type: string
        steps:
            - checkout
            - attach_workspace:
                at: .
            - run:
                command: |
                    # Retrieve BivwAk! ZIP packages from private repository JFrog
                    curl -L -o bivwak-ibm-container-service.zip https://${CIRCLECI_ARTIFACTORY_USER}:${CIRCLECI_ARTIFACTORY_PASSWORD}@ifsalpha.jfrog.io/artifactory/starterkits-<< parameters.target_artifactory_repo >>-generic-local/bivwak-ibm-container-service/<< parameters.target_version >>.zip
                    unzip -o bivwak-ibm-container-service.zip
                name: Retrieve target Terraform module from private repository & Unpack
            - run:
                command: |
                    if [[ << parameters.source_version >> == "0.16.0" && << parameters.target_version >> == "0.17.0" ]]
                    then
                      #################################
                      # Init terraform
                      #################################
                      tfenv use 1.0.7
                      terraform init

                      #################################
                      # Migrate 
                      #################################
                      function move_module_resources()
                      {
                        for resource in $(terraform state list |grep $1.$3)
                        do
                          new_resource=$(echo ${resource} |sed "s/$1/$2/g")
                          terraform state mv ${resource} ${new_resource}
                        done
                      }
                     
                      function delete_resources()
                      {
                        for resource in $(terraform state list |grep $1)
                        do
                          terraform state rm ${resource}
                        done
                      }
                     
                      terraform init
                     
                      # Move providers linked to code reorganization
                      rm -f provider.fix*
                     
                      terraform state pull | jq '.serial|=.+1' > provider.fix
                      sed -i .bak 's|module.*.provider\[|provider[|g' provider.fix
                      terraform state push provider.fix
                     
                      # Move terraform resources
                      OLD_PATH=module.bivwak_k8s
                      NEW_PATH=module.bivwak_k8sconfig
                      module_migrate_list=(
                        "module.bivwak_logdna_agent"
                        "module.bivwak_sysdig_agent"
                        "module.namespace"
                        "module.security.module.network_policy"
                        "module.security.module.pod_security_policy"
                        "module.security.module.mtls"
                      )
                     
                      for module in ${module_migrate_list[@]}
                      do
                        move_module_resources ${OLD_PATH} ${NEW_PATH} ${module}
                      done
                     
                      # Delete terraform resources
                      module_delete_list=(
                        "module.k8s_secret.data.kubernetes_secret"
                        "module.k8s_secret.kubernetes_secret"
                        "module.bivwak_k8sconfig.module.security.module.mtls.ibm_container_alb_cert.ingress_cert"
                        "module.bivwak_k8sconfig.module.security.module.mtls.kubernetes_secret.copy_ibm_container_alb_cert"
                        "module.k8s_config_maps"
                      )
                     
                      for module in ${module_delete_list[@]}
                      do
                        delete_resources ${module}
                      done
                     
                      # Concat json config files
                      config=$(jq -rs 'reduce .[] as $item ({}; . * $item)' <<parameters.path_vars>>/*.json |sed "s/\*/\\*/g")
                      namespaces=$(echo $config |jq '.cluster_info.namespaces[]' |sed "s/\"//g")
                      domains=$(echo $config |jq '.domains | keys[]'  |sed "s/\"//g")
                      environment=$(echo $config |jq '.environment_id' |sed "s/\"//g")
                      cluster_name=$(echo $config |jq '.cluster_info.cluster_name' |sed "s/\"//g")
                     
                      ibmcloud login
                      ibmcloud ks cluster config -c "${environment}-${cluster_name}"
                     
                      # Delete secrets from ibm-cert-store namespace
                      for domain in ${domains}
                      do
                        kubectl delete secret -n ibm-cert-store ingress-tls-cert-${domain} || echo "Secret ingress-tls-cert-${domain} does not exist in namespace ibm-cert-store"
                        resource=$(echo "module.bivwak_cis.module.https.ibm_cis_domain_settings.https_hardening[\"${domain}\"]")
                        terraform state rm $resource || echo "Resource module.bivwak_cis.module.https.ibm_cis_domain_settings.https_hardening[\"${domain}\"] does not exist"
                      done
                     
                      # Delete secrets/configmaps from application namespaces
                      for namespace in ${namespaces}
                      do
                        kubectl delete secret -n ${namespace} cos-backup-secrets || echo "Secret cos-backup-secrets does not exist in namespace ${namespace}"
                        kubectl delete secret -n ${namespace} cos-secrets || echo "Secret cos-secrets does not exist in namespace ${namespace}"
                        kubectl delete secret -n ${namespace} postgresql-secrets || echo "Secret postgresql-secrets does not exist in namespace ${namespace}"
                        kubectl delete secret -n ${namespace} redis-secrets || echo "Secret redis-secrets does not exist in namespace ${namespace}"
                        kubectl delete secret -n ${namespace} mongodb-secrets || echo "Secret mongodb-secrets does not exist in namespace ${namespace}"
                        kubectl delete secret -n ${namespace} application-secrets  || echo "Secret application-secrets does not exist in namespace ${namespace}"
                        kubectl delete configmap -n ${namespace} application-config-maps|| echo "Configmap application-configmaps does not exist in namespace ${namespace}"
                     
                        for domain in ${domains}
                        do
                          kubectl delete secret -n ${namespace} ingress-tls-cert-${domain} || echo "Secret ingress-tls-cert-${domain} does not exist in namespace ${namespace}"
                        done
                     
                      done
                      
                      #################################
                      # Launch  terraform apply
                      #################################
                      VAR_FILE_ARGS=""
                      for conf_file in <<parameters.path_vars>>/*
                      do
                        VAR_FILE_ARGS+="-var-file=<<parameters.path_vars>>/${conf_file##*/} "
                      done

                      terraform refresh ${VAR_FILE_ARGS}
                      terraform plan ${VAR_FILE_ARGS}
                      terraform apply ${VAR_FILE_ARGS} --auto-approve
                    else
                      echo "This migration job only concerns migration from container molecule 0.16.0 to 0.17.0"
                    fi
                name: Execute migration steps
````

How to call this new job ? 

````
      - starterkitsorb/migrate_container:
          name: migrate-container
          <<: *context
          requires:
            - inject-tf-backend
          target_artifactory_repo: release
          source_version: 0.16.0
          target_version: 0.17.0
          path_vars: env/integration
````


Migration procedure

1. Adapt the json files following this documentation / project needs
2. Configure the container migration job into the different workflows
4. Run the migration workflow
5 (optional) Run the deployment workflow until production (develop -> main/master)


#### Migration for level 2 / 3

1. Adapt the json files following this documentation / project needs
2. Adapt the container migration job into your different workflows
3. Adapt the module dependencies file 
   - to the right version of container molecule if you are using container molecule
     
````ini
bivwak-ibm-container-service:0.17.0:container:release
````

   - to use cis atom and fix the right version of atoms
    
````ini
bivwak-ibm-postgresql-module:0.6.0:postgresql:release
bivwak-ibm-redis-module:0.6.0:redis:release
bivwak-ibm-mongodb-module:0.6.0:mongodb:release
bivwak-ibm-cos-module:0.7.0:cos:release
bivwak-label-module:0.4.0:label:release
bivwak-ibm-cis-module:0.3.0:cis:release
bivwak-ibm-k8s-module:0.16.0:k8s:release
bivwak-ibm-k8sconfig-module:0.1.0:k8sconfig:release
````

4. Run the migration workflow
5. (optional) Run the deployment workflow until production (develop -> main/master)
