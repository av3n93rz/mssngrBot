module.exports = function () {
  return {
    name: ["rollfor"],
    admin: false,
    description: "Roll for target value",
    function: function (messageObj, query) {
	
      query = parseInt(query);

      if (isNaN(query)) throw Error("The target should be a number");
      if(query > 20 || query < 1) throw Error("Target is out of range");

      const rolledValue = Math.floor(Math.random() * 20) + 1;

      let message = `${rolledValue}, target${
        rolledValue < query && " not"
      } met!`;

      if (rolledValue === 1 && query !== 1) {
        message = "1, Critical Fail!";
      }

      if (rolledValue === 20) {
        message = "20, Critical Hit!";
      }

      return {
        type: "message",
        message,
      };
    },
  };
};
