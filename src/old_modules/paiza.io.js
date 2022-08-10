const request = require('request');
module.exports = function(api) {
  return {
    name: ["code", "run"],
    admin: false,
    description: "Execute code through paiza.io",
    function: async function(messageObj, str) {
      return new Promise(function(resolve, reject) {
        var regex = /```(.+?)\s([\s\S]*)```([\s\S]*)/.exec(str);

        if (!regex) reject("Bad input");

        var post = {
          api_key: "guest"
        };
        if (regex[1]) post["language"] = regex[1].trim();
        if (regex[2]) post["source_code"] = regex[2].trim();
        if (regex[3]) post["input"] = regex[3].trim();

        request.post(
          "http://api.paiza.io:80/runners/create",
          {
            form: post
          },
          function(err, resp, body) {
            if (err || resp.statusCode != 200) {
              reject("Failed to run code\n\n" + body);
              return;
            }

            var JSONbody = JSON.parse(body);
            if (JSONbody.error) {
              reject("Server Error: " + JSONbody.error);
              return;
            }

            (function loopResponse(id, count) {
              request.get(
                "http://api.paiza.io/runners/get_details?api_key=guest&id=" +
                  id,
                function(err, resp, body) {
                  if (err || resp.statusCode != 200) {
                    reject("Failed to run code\n\n" + body);
                    return;
                  }

                  if (JSON.parse(body).status != "completed") {
                    if (count == 5) {
                      reject("Code taking too long.. aborting");
                      return;
                    }
                    return loopResponse(id, count + 1);
                  }

                  var data = JSON.parse(body);
                  var result = ["```"];

                  if (data.build_result == "failure") {
                    result.push("Code Execution - BUILD FAILED");
                    result.push(data.build_stderr);
                  } else {
                    result.push(
                      "Code Execution" +
                        (data.result == "failure" ? " - FAILED" : "")
                    );
                    result.push("-".repeat(data.id.length));
                    result.push("");

                    if (data.stdout) {
                      result.push("= STDOUT =");
                      result.push(data.stdout);
                      result.push("");
                    }

                    if (data.stderr) {
                      result.push("= STDERR =");
                      result.push(data.stderr);
                      result.push("");
                    }

                    if (data.build_stderr) {
                      result.push("= BUILD WARNINGS =");
                      result.push(data.build_stderr);
                      result.push("");
                    }

                    result.push("-".repeat(data.id.length));
                    result.push("Exit Code: " + data.exit_code);
                    result.push("Execution Time: " + data.time + " seconds");

                    var i = Math.floor(Math.log(data.memory) / Math.log(1024));
                    result.push(
                      "Memory Usage: " +
                        (data.memory / Math.pow(1024, i)).toFixed(2) * 1 +
                        " " +
                        ["B", "kB", "MB", "GB", "TB"][i]
                    );
                  }

                  result.push("```");
                  resolve(result.join("\n"));
                }
              );
            })(JSONbody.id, 0);
          }
        );
      });
    }
  };
};
