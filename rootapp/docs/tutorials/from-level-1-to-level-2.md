# StarterKits from level 1 to level 2

This tutorials is aimed to all squads that are currently using StarterKits with level 1.

As a reminder, StarterKits levels are actually the depth of Terraform source code you will get.

- Level 1: No Terraform files in infrastructure repository
- Level 2: Terraform files in infrastructure repository

## Why I should be concerned by this tutorial

In case the molecules provided by BivwAk! platform do not fit your current need and you need to extend them with your own Terraform resources.
For instance:

- Integrate an additional postgreSQL ICD instance(s),
- Manage your own way CIS configuration (pagerules, WAF security rules ...)

## How to ?

To understand the different steps that will follow, we need to first understand what is actually done when using the CircleCI Orb job `deploy_molecule`.

This job, actually **download the version of the molecule you've provided** into the CircleCI container and perform following Terraform well-known sequence:

- `terraform init`: to initialize the Terraform Backend (link to [documentation](https://www.terraform.io/docs/language/settings/backends/index.html))
- `terraform refresh`: to synchronize the terraform state and the current configuration of your IBM resources instances,
- `terraform plan`: to detect the different actions to be performed,
- `terraform apply`: to execute the plan detected.

To enable **level 2**, we will have to replicate some of those steps into our CircleCI:

- Download the remote Terraform modules (molecule or atoms),
- Inject the Terraform backend configuration (as previously),
- Execute the terraform sequence.

But before doing this, let remind some of Terraform basics: modules.

## Terraform modules

A module is a container for multiple resources that are used together. Modules can be used to create lightweight abstractions, so that you can describe your infrastructure in terms of its architecture, rather than directly in terms of physical objects. ([source Terraform](https://www.terraform.io/docs/language/modules/develop/index.html))

So what is happening when you're using the `deploy_molecule`. As said before, the orb will download the packaged molecule (module) from Artifactory.

This molecule has been package with the same file hierarchy as you can find in [related molecule GitHub repository](https://github.com/ifs-alpha/bivwak-ibm-container-service/tree/master).

This means that your actual Terraform state is the form of:

```hcl
...
module.bivwak_k8s.module.iks.ibm_container_vpc_cluster.cluster
module.bivwak_k8s.module.iks.ibm_cis_dns_record.custom_ingress[key or index]
...
```

Because of the type of level 2 you will use, you may need to alter this state before migrating. This will be addressed in a dedicated category in this tutorial.

## Next Level - Variation - reuse of molecule module

### Step 1: Add your Terraform files

In order to work, you will need to add at least 2 files for this:

- main.tf : this terraform file will contain the existing molecule Terraform module (so that there's no recreation of resources), and that can possibly host your new ressources.
- variables.tf: this file will describe the different input variables that will be given to your terraform files.

Example, if you're going to level 2, with molecule 0.16.0.

**Caution**: you may need to adapt the following content depending on the version you have.
**Caution bis**: do not try to migrate version, and shift to level 2 in the same shot. ;)

**main.tf**
```hcl
# This resource represents the IBM Terraform provider used to manage the resource in your account
provider "ibm" {
  region     = var.region
}

This is a module representing the packaging of the *container molecule*
module "bivwak_container" {
  source                                      = "./remote_modules/container"
  region                                      = var.region
  project                                     = var.project
  environment_id                              = var.environment_id
  environment_type                            = var.environment_type
  application_name                            = var.application_name
  vpc_name                                    = var.vpc_name
  landing_zone_rg                             = var.landing_zone_rg
  starterkits_rg                              = var.starterkits_rg
  landing_zone_activity_tracker_instance_name = var.landing_zone_activity_tracker_instance_name
  landing_zone_logdna_instance_name           = var.landing_zone_logdna_instance_name
  landing_zone_sysdig_instance_name           = var.landing_zone_sysdig_instance_name
  domains                                     = var.domains      
  cluster_info                                = var.cluster_info
  postgresql_instance_info                    = var.postgresql_instance_info
  cos_instance_info                           = var.cos_instance_info
  cis_instance_info                           = var.cis_instance_info      
  sharedcis_ibmcloud_api_key                  = var.sharedcis_ibmcloud_api_key
}
```

**variables.tf** (or retrieve it directly in https://github.com/ifs-alpha/bivwak-ibm-container-service/blob/YOUR_VERSION/variables.tf)
```hcl
variable "region" {
  description = "IBM Region where the infrastructure is hosted in"
}
variable "project" {
  type        = string
  description = "Project"
}
variable "environment_id" {
  type        = string
  description = "Environment id (e.g. `integration`)"
}
variable "environment_type" {
  type        = string
  description = "Environment (e.g. `int`)"
}
variable "application_name" {
  type        = string
  description = "Environment (e.g. `service`)"
}
variable "vpc_name" {
  type = string
}

variable "landing_zone_rg" {
  type        = string
  description = "The name of the landing zone resource group where landing zone resources are attached"
}

variable "starterkits_rg" {
  type        = string
  description = "The resource group where the starterkits resource will be deployed"
}

variable "landing_zone_cis_instance_name" {
  type    = string
  default = "sharedcis"
}

variable "landing_zone_activity_tracker_instance_name" {
  type        = string
  description = "The name of the Activity Tracker instance provisionned by LandingZone"
}

variable "landing_zone_logdna_instance_name" {
  type        = string
  description = "The name of the logdna instance provisionned by LandingZone"
}
variable "landing_zone_sysdig_instance_name" {
  type        = string
  description = "The name of the sysdig instance provisionned by LandingZone"
}

variable "cluster_info" {
  type = object({
    cluster_name      = string
    machine_type      = string
    worker_count      = number
    high_availability = bool
    kube_version      = string
    namespaces        = list(string)
    worker_pools = map(object({
      machine_type = string
      min_size     = number
      max_size     = number
      labels       = map(string)
    }))
    domains = map(object({
      subdomains = map(object({
        rate_limiting_rule = object({
          methods       = list(string)
          threshold     = number
          period        = number
          timeout       = number
          response_type = string
          response_body = string
        })
        ingress_authorized_ips = list(string)
      }))
    }))
    sysdig_filters = object({
      includes = list(string)
    })
  })
}

variable "postgresql_instance_info" {
  type = object({
    name                         = string
    plan                         = string
    version                      = string
    members_memory_allocation_mb = number
    members_disk_allocation_mb   = number
  })
  default = null
}

variable "cos_instance_info" {
  type = object({
    cos_instance_name       = string
    bucket_iam_role         = list(string)
    application_allowed_ips = list(string)
    backup_config = object({
      backup_expire_days = number
      backup_scheduler = string
      backup_prefix_format = string
    })
    buckets = map(object({
      storage_class = string
      force_delete  = bool 
    }))
  })
  default = null
}

variable "cis_instance_info" {
  type = object({
    blocked_countries = list(string)
  })
  default = { blocked_countries = [] }
}

variable "sharedcis_ibmcloud_api_key" {
  type = string
}
```

### Step 2: Add the description of the remote modules

BivwAk! is working with a private Terraform repository hosted on our JFrog Artifactory instance.

As a consequence, and because the "http" backend used does not support advanced security feature in terraform 0.12, we have decided to previously download the remote terraform modules and store them dynamically in the pipeline.

- Add in `config/module_dependencies.ini`

```
bivwak-ibm-container-service:YOUR_VERSION:container:release
```

Here is the naming convention: `terraform-module-name:version:local-module-name:env_target`

- `terraform-module-name`: this is the name of the module you want to retrieve. In this tutotial, we want to retrieve the content of the following repository: https://github.com/ifs-alpha/bivwak-ibm-container-service.
But it exists several more fine-grained modules that we call "atoms", such as ICD PostgreSQL, ICD MongoDB, COS ... as independent and integrable Terraform modules
- `version`: the version your want to retrieve, give the full version number.
- `local-module-name`: **this step is really important**, it is important the `local-module-name` matches the folder name informed in the module:
```
Extract from main.tf
source = "remote_modules/local-module-name"
```
- `env_target`: only used for development purpose, leave it as is with `release` value.


### Step 3: Add the required library to download_modules

This file will be required in order to be processed by the CircleCI Orb

- Add in `tests/requirements.txt`:

```
--index-url https://${CIRCLECI_ARTIFACTORY_USER}:${CIRCLECI_ARTIFACTORY_PASSWORD}@ifsalpha.jfrog.io/artifactory/api/pypi/starterkits-python-lib-release-local/simple
bivwak-ibm-commons==0.4.2
--extra-index-url https://www.pypi.org/simple
```

Note that you can actually test the behavior of this locally.

```
pip3 install -r tests/requirements.txt
python3 -m bivwak.ibm.build.download_modules
```

You will see the result:

- A new folder `remote_modules`
- A subfolder, with `local-module-name` and its source within.

### Step 4: Prepare your Terraform state file

Terraform must store state about your managed infrastructure and configuration. This state is used by Terraform to map real world resources to your configuration, keep track of metadata, and to improve performance for large infrastructures. (source: [Terraform documentation](Terraform must store state about your managed infrastructure and configuration. This state is used by Terraform to map real world resources to your configuration, keep track of metadata, and to improve performance for large infrastructures.))

But, as previously mentionned, the structure and the hierarchy of a terraform statefile will have an incidence, because of the use of molecule as a module.

For example:

If you had `ibm_container_vpc_cluster.cluster` moved to `module.A.ibm_container_vpc_cluster.cluster`, Terraform will destroy and replace the resource. Which is not what we want.

To avoid this, and because we are integrating the molecule through a module, we are going to alter the hierarchy of the Terraform statefile.

**Before executing, we are going to add a prefix**.

This prefix is actually the "resource path" we are layering by adding the new module in `main.tf`: `module.bivwak_container`.

To do so, we have implemented a CircleCI Orb job that will help you.

You can run following workflow in your CircleCI config file:

```yaml
version: 2.1

orbs:
  utils-orb: bivwak/utils-orb@0.0.45
  starterkit-orb: bivwak/starterkits-orb@2.5.1

workflows:
  next-level-preparation-workflow:
    jobs:
      - utils-orb/inject_backend_terraform:
          context: YOUR_CONTEXT
          name: inject-backend
          state_key: YOUR_STATE_FILE_KEY
          filters:
            branches:
              only:
                - YOUR_BRANCH
      - starterkit-orb/tf_state_add_prefix:
          context: YOUR_CONTEXT
          name: add-prefix
          prefix: module.bivwak_container # Adapt if you change the name of the module in your main.tf
          requires:
            - inject-backend
          filters:
            branches:
              only:
                - YOUR_BRANCH
```


### Final step: adapt your CircleCI workflow to handle Terraform files

Once all requirements have been met:

- `main.tf` exists at the root of your project
- `variables.tf` exists at the root of your project
- `tests/requirements.txt` exists
- `config/module_dependencies.ini` exists
- Terraform state file has been altered.

You're now ready to handle your infrastructure through Terraform and extend the provided boilerplate by BivwAk!.

Example of CircleCI workflow for level 2:

```yaml
version: 2.1

orbs:
  utils-orb: bivwak/utils-orb@0.0.45
  starterkit-orb: bivwak/starterkits-orb@2.5.1

workflows:
  manage-integration-infrastructure:
    jobs:
       - utils-orb/inject_backend_terraform:
          context: YOUR_CONTEXT
          name: inject-backend
          state_key: YOUR_STATE_FILE_KEY
          filters:
            branches:
              only:
                - develop
      - starterkit-orb/download_modules:
          context: YOUR_CONTEXT
          name: download-modules
          filters:
            branches:
              only:
                - develop
      - starterkit-orb/terraform_execution:
          context: YOUR_CONTEXT
          requires:
            - inject-backend
            - download-modules
          path_vars: environments/integration
          filters:
            branches:
              only:
                - develop
```

Push your changes to the repository, and observe the CircleCI workflows.

--> There should not be ANY CHANGES for main resources such as Cluster, Databases, Object Storage ...