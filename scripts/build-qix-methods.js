// with qix version, go through the schema and publish into operators
var fs = require("fs-extra");
var path = require("path");
var pack = JSON.parse(fs.readFileSync("package.json", "utf8"));

// qix version
var version = pack["qix-version"];

var srcSchema = require(`../node_modules/enigma.js/schemas/${version}.json`);

var qClasses = Object.keys(srcSchema.structs);

var classImports = [];
var classExports = [];

qClasses.forEach(qClass => {
  var methods = srcSchema.structs[qClass];

  var classDir = `../src/${qClass}`;
  var absClassDir = path.join(__dirname, classDir);
  fs.emptydirSync(absClassDir);

  var importCode = [];
  var exportCode = [];

  Object.keys(methods).forEach(method => {
    var methodFileName = method
      .slice(0, 1)
      .toLowerCase()
      .concat(method.slice(1));

    var output = methods[method].Out;
    var script = generateScript(method, output);

    fs.writeFile(path.join(absClassDir, `${methodFileName}.js`), script);

    importCode.push(`import ${methodFileName} from "./${methodFileName}.js";`);
    exportCode.push(`export { ${methodFileName} };`);
  });

  var indexCode = importCode
    .join("\n")
    .concat("\n")
    .concat(exportCode.join("\n"));
  fs.writeFile(path.join(absClassDir, `index.js`), indexCode);

  classImports.push(`import * as ${qClass} from "./${qClass}";`);
  classExports.push(`export { ${qClass} }`);
});

// var indexCode = classImports.join("\n").concat("\n").concat(classExports.join("\n"));
// fs.writeFile(path.join(path.join(__dirname,"../src"),`index.js`), indexCode);

function generateScript(methodName, output) {
  const returnParam = output.length === 1 ? `"${output[0].Name}"` : "";
  return `import mapQixReturn from "../util/map-qix-return.js";

export default function(handle, ...args) {
    return handle.ask("${methodName}", ...args).pipe(
        mapQixReturn(${returnParam})
    );
}`;
}
