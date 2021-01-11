const util = require('util')

function variable(state, var_name, info = false) {
    for (let i = state.call.length - 1; i >= 0; i--) {
        let call = state.call[i];

        if (call.vars[var_name]) {
            if (info)
                return {t: call.vars[var_name].t, v: call.vars[var_name].v, i: i}
            return call.vars[var_name];
        }
    }

    throw "'" + var_name + "' is an undeclared variable\n";
}

const rvalue_actions = {
    "number": (rvalue, state) => {
        let value = parseFloat(rvalue[1]);

        if (value == null)
            throw "invalid number '" + rvalue[1] + "'\n";
        else
            return {t: "number", v: value};
    },
    "string": (rvalue, state) => {
        let value = rvalue[1];

        if (typeof value != "string")
            throw "'" + rvalue[1] + "' is not a string\n";
        else
            return {t: "string", v: value};
    },
    "var": (rvalue, state) => {
        let var_name = rvalue[1];

        if (typeof var_name != "string")
            throw "invalid type for variable name\n";

        return variable(state, var_name);
    },
    "+": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "number", v: v1.v + v2.v};

        throw "unrecognized types of arguments for addition\n";
    },
    "-": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "number", v: v1.v - v2.v};

        throw "unrecognized types of arguments for subtraction\n";
    },
    "*": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "number", v: v1.v * v2.v};

        throw "unrecognized types of arguments for multiplication\n";
    },
    "/": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "number", v: v1.v / v2.v};

        throw "unrecognized types of arguments for division\n";
    },
    "true": (rvalue, state) => {
        return {t: "boolean", v: true};
    },
    "false": (rvalue, state) => {
        return {t: "boolean", v: true};
    },
    "==": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        return {t: "boolean", v: v1.v == v2.v};
    },
    "!=": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        return {t: "boolean", v: v1 != v2};
    },
    ">": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "boolean", v: v1.v > v2.v};

        throw "unrecognized types of arguments for comparison\n";
    },
    "<": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "boolean", v: v1.v < v2.v};

        throw "unrecognized types of arguments for comparison\n";
    },
    ">=": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "boolean", v: v1.v >= v2.v};

        throw "unrecognized types of arguments for comparison\n";
    },
    "<=": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "number" && v2.t == "number")
            return {t: "boolean", v: v1.v <= v2.v};

        throw "unrecognized types of arguments for comparison\n";
    },
    "&&": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "boolean" && v2.t == "boolean")
            return {t: "boolean", v: v1.v && v2.v};

        throw "unrecognized types of arguments for boolean operation\n";
    },
    "||": (rvalue, state) => {
        let v1 = run_rvalue(rvalue[1], state);
        let v2 = run_rvalue(rvalue[2], state);

        if (v1.t == "boolean" && v2.t == "boolean")
            return {t: "boolean", v: v1.v || v2.v};

        throw "unrecognized types of arguments for boolean operation\n";
    },
    "!": (rvalue, state) => {
        let value = run_rvalue(rvalue[1], state);

        if (value.t == "boolean")
            return {t: "boolean", v: !value.v};

        throw "unrecognized types of arguments for boolean operation\n";
    }
}

function newState() {
    return {
        call: [{name: "<global>", vars: {}}]
    }
}

function run_rvalue(rvalue, state) {
    let type = rvalue[0];

    if (rvalue_actions[type])
        return rvalue_actions[type](rvalue, state);
    else
        throw "unrecognized array type (first element) '" + type + "'\n";
}

function new_call(name, state) {
    state.call.push({name: name, vars: {}});
}

function do_call(state, name, func, args) {
    new_call(name, state);
    if (args && func.a) {
        for (let i = 0; i < func.a.length; i++) {
            state.call[state.call.length - 1].vars[func.a[i]] = args[i];
        }
    }
    run(state, func.v, name);
    state.call.pop();
}

function run(state, json, name) {
    let ptr = 0;

    if (!Array.isArray(json))
        throw "Array expected.\n";

    function ex(m) {
        throw m + "\nat Array " + (ptr + 1) + " in " + name;
    }

    let var_name;
    let rvalue;
    let condition;
    let args;
    let res_args;
    let code;

    try {
        while (ptr < json.length) {
            let stat = json[ptr];
            let type = stat[0];
            
            if (typeof type != "string")
                throw "array type (first element) is not a string.\n";

            switch (type) {
                case "decl":
                    var_name = stat[1];
                    rvalue   = stat[2];

                    if (typeof var_name != "string")
                        throw "rvalue (second element) is of unrecognized type.\n";

                    if (!Array.isArray(rvalue))
                        throw "lvalue (third element) is of unrecognized type.\n";

                    if (state.call[state.call.length - 1].vars[var_name])
                        throw "'" + var_name + "' has already been defined\n";

                    state.call[state.call.length - 1].vars[var_name] = run_rvalue(rvalue, state);
                    break;
                case "set":
                    var_name = stat[1];
                    rvalue   = stat[2];

                    if (typeof var_name != "string")
                        throw "rvalue (second element) is of unrecognized type.\n";

                    let ret = variable(state, var_name);

                    if (!Array.isArray(rvalue))
                        throw "lvalue (third element) is of unrecognized type.\n";

                    state.call[ret.i].vars[var_name] = run_rvalue(rvalue, state);
                    break;
                case "if":
                    condition = stat[1];
                    code = stat[2];

                    if (!Array.isArray(condition))
                        throw "condition of if statement (second element) is not an array.\n";

                    if (!Array.isArray(code))
                        throw "body of if statement (third element) is not an array.\n";

                    let val = run_rvalue(condition, state);

                    if (val.t != "boolean")
                        throw "boolean expected as condition, got '" + val.t + "'\n";

                    if (val.v) run(state, code)
                    else {
                        if (stat[3] == "else") {
                            if (!Array.isArray(stat[4]))
                                throw "body of else statement (fifth element) is not an array\n";

                                run(state, stat[4]);
                        }
                    };

                    break;
                case "do":
                    code = stat[1];

                    if (!Array.isArray(code))
                        throw "body of do statement (second element) is not an array\n";

                    do_call(state, "do", {t: "function", v: code});

                    break;
                case "function":
                    var_name = stat[1];
                    args = stat[2];
                    code = stat[3];

                    if (typeof var_name != "string")
                        throw "rvalue (second element) is of unrecognized type\n";

                    if (!Array.isArray(args))
                        throw "arguments of function (third element) is not an array\n";

                    for (let i = 0; i < args.length; i++)
                        if (typeof args[i] != "string")
                            throw "argument " + i + " of function is not a string type\n";

                    if (!Array.isArray(code))
                        throw "body of function (fourth element) is not an array\n";

                    if (state.call[state.call.length - 1].vars[var_name])
                        throw "'" + var_name + "' has already been defined\n";

                    state.call[state.call.length - 1].vars[var_name] = {t: "function", v: code, a: args};
                    break;
                case "call":
                    var_name = stat[1];
                    args = stat[2];

                    res_args = undefined;

                    if (typeof var_name != "string")
                        throw "rvalue (second element) is of unrecognized type\n";

                    if (args) {
                        if (!Array.isArray(args))
                            throw "arguments of function call (third element) must be an array\n";

                        res_args = [];

                        for (let arg of args) {
                            res_args.push(run_rvalue(arg, state))
                        }
                    }

                    let func = variable(state, var_name);

                    if (func.t != "function")
                        throw "'" + var_name + "' is not callable.";

                    do_call(state, var_name, func, res_args);
                    
                    break;
                case "log":
                    rvalue = stat[1];

                    if (!Array.isArray(rvalue))
                        throw "at log statement; the first given argument is not an array\n";

                    console.log( run_rvalue(rvalue, state).v );
                    break;
                default:
                    throw "unrecognized array type (first element) '" + type + "'\n";
            }

            ptr++;
        }
    } catch(e) {
        ex(e);
    }
}

function execute(state, json) {
    run(state, json, state.call[state.call.length - 1].name);
}

exports.newState = newState;
exports.run = run;
exports.execute = execute;