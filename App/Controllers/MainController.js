(function () {

    'use strict';

    angular.module('app').controller('MainController', ['$scope', 'JSOMService', MainController]);

    function MainController($scope, JSOMService, $timeout) {
        $scope.loading = true;
        $scope.employeeId = getUrlVars();
        $scope.editingData = {};
        $scope.isVisible = true;
        $scope.isLoaded = false;

        $scope.editCompetenceTraningDate = function (competence) {

            $scope.editingData[competence.Id + "--traningDate"] = true;

            competence.TrainingDate = '';
            $scope.isVisible = false;
        }

        $scope.editCompetenceRepeatDate = function (competence) {

            $scope.editingData[competence.Id + "--repeatDate"] = true;
            competence.RepeatDate = '';
            $scope.isVisible = false;
        }

        $scope.editInstructionTraningDate = function (competenceID, instruction) {

            $scope.editingData[competenceID + '-' + instruction.Id] = true;
            instruction.TrainingDate = '';
            $scope.isVisible = false;
            $scope.isLoaded = true;

            if (!instruction.Category) {

                JSOMService.getInstructionCategory(instruction.Id).then(function (result) {
                    instruction.Category = result.Category;
                    $scope.isLoaded = false;
                });

            } else {
                $scope.isLoaded = false;
            }

        };

        $scope.saveCompetenceTraningDate = function (competence) {

            $scope.isLoaded = true;
            JSOMService.updateCompetenceDates(competence, $scope.employeeId).then(function (isNew) {
                $scope.editingData[competence.Id + "--traningDate"] = false;
                $scope.editingData[competence.Id + "--traningDate" + '-success'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;

                if (isNew) {
                    $scope.loading = true;
                    init();
                }

            }).catch(function () {

                $scope.editingData[competence.Id + "--traningDate"] = false;
                $scope.editingData[competence.Id + "--traningDate" + '-error'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;
                competence.TrainingDate = null;
                competence.RepeatDate = null;

            });
        };

        $scope.saveCompetenceRepeatDate = function (competence) {

            $scope.isLoaded = true;
            JSOMService.updateCompetenceDates(competence, $scope.employeeId).then(function (isNew) {
                $scope.editingData[competence.Id + "--repeatDate"] = false;
                $scope.editingData[competence.Id + "--repeatDate" + '-success'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;

                if (isNew) {
                    $scope.loading = true;
                    init();
                }

            }).catch(function () {

                $scope.editingData[competence.Id + "--repeatDate"] = false;
                $scope.editingData[competence.Id + "--repeatDate" + '-error'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;
                competence.TrainingDate = null;
                competence.RepeatDate = null;

            });
        };

        $scope.saveInstructionTraningDate = function (competenceID, instruction) {


            $scope.isLoaded = true;
            setInstructionRepeatDate(instruction);
            JSOMService.updateInstructionDates(instruction, $scope.employeeId).then(function (isNew) {
                $scope.editingData[competenceID + '-' + instruction.Id] = false;
                $scope.editingData[instruction.Id + '-success'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;
                if (isNew) {
                    $scope.loading = true;
                    init();
                }

                // $scope.reset(); 
            }).catch(function () {

                $scope.editingData[competenceID + '-' + instruction.Id] = false;
                $scope.editingData[instruction.Id + '-error'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;
                instruction.TrainingDate = null;
                instruction.RepeatDate = null;
                setInstructionRepeatDate(instruction);

            });
        };

        $scope.reset = function () {
            // delete $scope.editingData[competenceID + '-' + data.Id];
        };

        var setInstructionRepeatDate = function (i) {
            $scope.competences.forEach(function (competence) {

                competence.Instructions.forEach(function (instruction) {

                    if (instruction.Id === i.Id) {

                        var addNYears = function (date, n) {
                            var d = new Date(date);
                            d.setFullYear(d.getFullYear() + n);
                            return d.toJSON().slice(0, 10);
                        }

                        switch (i.Category) {
                            case "Cat. 1":
                                instruction.RepeatDate = addNYears(i.TrainingDate, 1);
                                break;
                            case "Cat. 2":
                                instruction.RepeatDate = addNYears(i.TrainingDate, 2);
                                break;
                            case "Cat. 3":
                                instruction.RepeatDate = addNYears(i.TrainingDate, 3);
                                break;
                            default:
                                instruction.RepeatDate = null;

                        }



                    }
                });
            });
        };

        function getUrlVars() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars.ID;
        }

        init();

        function init() {

            JSOMService.getSiteUrl().then(function (result) {
                $scope.siteUrl = result;

            });

            // var valuesToLoad = 3;
            JSOMService.getEmployeeCompetences($scope.employeeId).then(function (result) {
                $scope.competences = result;

            }).then(function () {

                var competenceIds = $scope.competences.map(function (competence) {
                    return competence.Id;
                });

                return JSOMService.getCompetenceInstructions(competenceIds).then(function (result) {

                    var resultLookup = result.reduce(function (lookup, instruction) {
                        lookup[instruction.Id] = instruction;
                        return lookup;
                    }, {});

                    $scope.competences.forEach(function (competence) {
                        var instruction = resultLookup[competence.Id];

                        if (instruction) {
                            competence.Instructions = instruction.Instructions; // added new key in object
                        }

                    });

                    JSOMService.getCompetencesDatesForEmployee($scope.employeeId).then(function (result) {

                        var resultLookup = result.reduce(function (lookup, competence) {
                            lookup[competence.CompetenceId] = competence;
                            return lookup;
                        }, {});

                        $scope.competences.forEach(function (obj) {

                            var competence = resultLookup[obj.Id];

                            if (competence) {
                                obj.ItemId = competence.ItemId;
                                obj.TrainingDate = competence.TrainingDate;
                                obj.RepeatDate = competence.RepeatDate;
                            } else {
                                obj.ItemId = null;
                                obj.TrainingDate = undefined;
                                obj.RepeatDate = null;
                            }

                        });
                    });
                });

            }).then(function () {

                JSOMService.getInstructionsDatesForEmployee($scope.employeeId).then(function (result) {

                    var resultLookup = result.reduce(function (lookup, instructionDate) {
                        lookup[instructionDate.InstructieId] = instructionDate;
                        return lookup;
                    }, {});


                    for (var i = 0; i < $scope.competences.length; i++) {

                        var instructions = $scope.competences[i].Instructions;

                        instructions.forEach(function (obj) {

                            var instructionDate = resultLookup[obj.Id];

                            if (instructionDate) {
                                obj.ItemId = instructionDate.ItemId;
                                obj.TrainingDate = instructionDate.TrainingDate;
                                obj.RepeatDate = instructionDate.RepeatDate;
                            } else {
                                obj.ItemId = null;
                                obj.TrainingDate = undefined;
                                obj.RepeatDate = null;
                            }
                        });

                        $scope.competences[i].Instructions.sort(function (a, b) {
                            return new Date(a.RepeatDate) - new Date(b.RepeatDate);
                        });
                    };
                    $scope.loading = false;
                });
            });
        }
    }
})();
