(function() {

    'use strict';

    angular.module('app').controller('RaportController', ['$scope', 'JSOMService', RaportController]);

    function RaportController($scope, JSOMService) {
        
        JSOMService.getSiteUrl().then(function(result) {
            $scope.siteUrl = result;

        });

        $scope.finalObject = false;
        $scope.dataFiltersValues = ["ends for 1 month", "ends for 2 months"];
        $scope.filterValue = $scope.dataFiltersValues[""];
        $scope.refresh = function() {
            $scope.finalObject = false;
            init();
        };



        // LOCAL STORAGE 
        var storage = JSON.parse(localStorage.getItem("instructions"));

        if (storage && storage.length) {
            $scope.finalObject = false;
            $scope.finalObject = storage;
            return;
        }



        init();

        function init() {

            

            return JSOMService.getEmployees().then(function(result) {

                $scope.employees = result;

            }).then(function() {

                return JSOMService.getCompetences().then(function(result) {


                    var resultLookup = result.reduce(function(lookup, competence) {
                        lookup[competence.Id] = competence;
                        return lookup;
                    }, {});


                    $scope.employees.forEach(function(employee) {

                        $scope.competences = [];
                        employee.Competences.forEach(function(obj) {

                            var competence = resultLookup[obj.Id];
                            if (competence) {
                                $scope.competences.push(competence);
                            }

                        });
                        employee.Competences = $scope.competences;
                    });

                });

            }).then(function() {
                // LOAD HERHALING DATA LIST Items --- result 
                return JSOMService.getHerhalingData().then(function(result) {
                    $scope.Datas = result;

                    var resultLookupEmployeeInstructionsExist = result.reduce(function(lookup, instructionData) {
                        lookup[instructionData.InstructieId + ',' + instructionData.MedewerkerId] = instructionData;
                        return lookup;
                    }, {});

                    var resultLookupMedewerkerId = result.reduce(function(lookup, instructionData) {
                        lookup[instructionData.MedewerkerId] = instructionData;
                        return lookup;
                    }, {});

                    $scope.finalObject = [];

                    $scope.employees.forEach(function(employee) {

                        var employeeInstructions = $scope.Datas.filter(function(r) {
                            return r.MedewerkerId === employee.Id;
                        })

                        if (!employeeInstructions.length) {
                            return;
                        }

                        employee.Competences.forEach(function(competence) {

                            competence.Instructions.forEach(function(instruction) {

                                var existEmployee = resultLookupMedewerkerId[employee.Id];

                                if (!existEmployee) {
                                    return;
                                }

                                var existInstruction = resultLookupEmployeeInstructionsExist[instruction.Id + ',' + employee.Id];

                                if (!existInstruction) {
                                    return;
                                }



                                $scope.inNMonths = function(n) {
                                    var d = new Date();
                                    d.setMonth(d.getMonth() + n);
                                    return d.toJSON().slice(0, 10);
                                }

                                function toJSONLocal(date) {
                                    var local = new Date(date);
                                    local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                                    return local.toJSON().slice(0, 10);
                                }

                                $scope.lessThan = function(prop, val) {
                                    return function(obj) {
                                        var expirty = toJSONLocal(prop);
                                        if (obj[prop] < inNMonths(val)) return true;
                                    }
                                }

                                $scope.finalObject.push({
                                    Name: employee.Name,
                                    EmployeeId: employee.Id,
                                    InstructionId: instruction.Id,
                                    Instruction: existInstruction.InstructieName,
                                    CompetenceId: competence.Id,
                                    Competence: competence.Name,
                                    TrainingDate: existInstruction.TrainingDate,
                                    ExpiryDate: existInstruction.ExpiryDate
                                });

                            })

                        })

                    });

                    localStorage.setItem("instructions", JSON.stringify($scope.finalObject));
                });

            }).catch(function(errorMsg) {
                $scope.error = errorMsg;
            });

        }
    }

    angular.module('app').filter("dataFilters", function() {


        return function(items, value) {


            if (value && value !== '') {

                var arrayToReturn = [];
                var d = new Date();
                d.setMonth(d.getMonth() + parseInt(value) + 1);
                // console.log("is number");

                for (var i = 0; i < items.length; i++) {

                    var expiry = new Date(items[i].ExpiryDate);
                    if (expiry < d) {
                        arrayToReturn.push(items[i]);

                    }

                }

                return arrayToReturn;
            }

            return items;


        };
    });
})();
