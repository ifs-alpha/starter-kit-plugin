const zip = require('zip-a-folder').zip;
const vscode = require('vscode');


const { generateTemplateFilesBatch } = require('generate-template-files');
const APPCONFIG_LOCATION = '/appconfig.yml';
let jsonConfig;


function loadConfiguration(root) {
  try {
    const yaml = require('js-yaml');
    const fs = require('fs');
    jsonConfig = yaml.load(fs.readFileSync(root+APPCONFIG_LOCATION, 'utf8'));
    console.log(jsonConfig);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}


/**
 * Cree à partir d'un JSON, un nouvel objet dont les clés sont toutes applaties.
 * Par exemple, si en entrée nous avons 
 * {a: {b: 3}, "hello": "world" }, alors nous aurons en sortie 
 * {"a.b" : 3, "hello": "world" } 
 * 
 * Ceci permettra dynamiquement de modifier les placeholders là où ils sont utilisés, 
 * sans devoir écrire manuellement le nom de la variable à modifier dans le générateur 
 */
function flattenObject(inputObject) {
  let toReturn = {};

  for (let key in inputObject) {
    // Ignorer si la clé n'est pas une clé pure de l'objet
    if (!inputObject.hasOwnProperty(key)) {
      continue;
    }

    // S'il s'agit d'un sous objet
    if ((typeof inputObject[key]) == 'object' && inputObject[key] !== null) {
      const flatObject = flattenObject(inputObject[key]);
      for (let x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) {
          continue;
        }

        toReturn[key + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[key] = inputObject[key];
    }
  }
  return toReturn;
}

function generate(root) {
// On recupere la configuration

loadConfiguration(root);



const flattenJsonConfig = flattenObject(jsonConfig);
console.log(flattenJsonConfig);

//Create a list of object, in the format : 
//{slot: "{{the_key_in_yaml_config}}", slotValue: "its_value"}.  
const dynamicPlaceholders = Object.entries(flattenJsonConfig).map(([key, value]) => {
  return {slot: `{{${key}}}`, slotValue: value}
})

// console.log(dynamicPlaceholders)

generateTemplateFilesBatch([
  {
    option: 'Project generation',
    defaultCase: '(noCase)',
    entry: {
      folderPath: root+'/rootapp/',
    },
     // Idee d'amelioration: plutot que de lister manuellement dans le tableau suivant, les placeholders
    // et leur valeurs, on pourrait dynamiquement créer un tableau contenant : {la clé de la propriété : la valeur de la propriété},
    // avec la clé generée automatiquement avec la fonction flattenObject sur l'objet jsonConfig.
    // Ce qui permettra d'automatiqement remplacer les propriétés contenues dans les templates, 
    // si elles sont de la forme {{abc.def.ghi}} (qui correspondra à une ppté yaml abc.def.ghi)
    // (voir "dynamicPlaceholders" commenté ci dessus)
    dynamicReplacers: dynamicPlaceholders,
    //[
      // { slot: '{{YOUR_INTEGRATION_CONTEXT}}', slotValue: jsonConfig.circleci.context.integration },
      // { slot: '{{YOUR_CANDIDATE_CONTEXT}}', slotValue: jsonConfig.circleci.context.candidate },
      // { slot: '{{YOUR_RELEASE_CONTEXT}}', slotValue: jsonConfig.circleci.context.release },

      // // Common config.
      // { slot: '{{YOUR_PROJECT}}', slotValue: jsonConfig.project.name },
      // { slot: '{{YOUR_APP_NAME}}', slotValue: jsonConfig.project.appName },
      // { slot: '{{VPC_NAME}}', slotValue: jsonConfig.project.vpcName },


      // { slot: '{{ACTIVITY_TRACKER_NAME}}', slotValue: jsonConfig.landingzone.activityTracker },
      // { slot: '{{SYSDIG_NAME}}', slotValue: jsonConfig.landingzone.sysdig },
      // { slot: '{{LOGDNA_NAME}}', slotValue: jsonConfig.landingzone.logdna },

      // // Domains. TODO: Construire dynamiquement cette liste si plusieurs sous domaines sont detectés
      // { slot: '{{YOUR_DOMAIN_NAME}}', slotValue: jsonConfig.project.domains.root },
      // { slot: '{{YOUR_SUBDOMAIN_NAME}}', slotValue: jsonConfig.project.domains.subdomains[0].name },

      // // Cos config
      // { slot: '{{COS_NAME}}', slotValue: jsonConfig.cos.name },
      // { slot: '{{BUCKET_NAME}}', slotValue: jsonConfig.cos.bucketName },

      // // K8S
      // { slot: '{{CLUSTER_NAME_INTEGRATION}}', slotValue: jsonConfig.k8s.cluster.name.integration },
      // { slot: '{{CLUSTER_NAME_CANDIDATE}}', slotValue: jsonConfig.k8s.cluster.name.candidate },
      // { slot: '{{CLUSTER_NAME_RELEASE}}', slotValue: jsonConfig.k8s.cluster.name.release },

      // { slot: '{{CLUSTER_NAMESPACES}}', slotValue: jsonConfig.k8s.cluster.namespaces },

      // // MongoDB
      // { slot: '{{MONGODB_NAME}}', slotValue: jsonConfig.mongodb.name },

      // // PostgreSQL
      // { slot: '{{POSTGRESQL_NAME}}', slotValue: jsonConfig.postgresql.name },
      // // Redis
      // { slot: '{{REDIS_NAME}}', slotValue: jsonConfig.redis.name },

    //],
    output: {
      path: root+`/out/`,
      overwrite: true,
    },

    onComplete: async (results) => {
      // A la fin, generer un zip si loption --zip a été fournie en argument
      const shouldZip = process.argv[2] === '--zip'
      console.log(root+'/out');

      if (shouldZip) {
        const zipFile = './generated-project.zip';

        console.log("Generating zipped project build : " + zipFile);
        await zip('./out/', zipFile);
        console.log("Done")
      }
    },
  },
]).catch((e) => {
  console.log('Build Error', e);
});
try {
  console.log(root);
  let uri = vscode.Uri.file(root+'/out');
  let result = vscode.commands.executeCommand('vscode.openFolder', uri);
      console.log(result)
      } catch (err) {
        console.error(err);
      }
}

module.exports = {generate}

