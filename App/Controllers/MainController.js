(function() {

    'use strict';

    angular.module('app').controller('MainController', ['$scope', 'JSOMService', MainController]);

    function MainController($scope, JSOMService, $timeout) {
        $scope.loading = true;
        $scope.employeeId = getUrlVars();
        $scope.editingData = {};
        $scope.isVisible = true;
        $scope.isLoaded = false;

        $scope.editCompetenceTraningDate = function(competence) {
            
            $scope.editingData[competence.Id] = true;
            competence.TrainingDate = '';
            $scope.isVisible = false;
        }

        // $scope.saveCompetenceTraningDate = function(competence) {
            
        //     $scope.editingData[competence.Id] = false;
        //     $scope.editingData[competence.Id + '-success'] = true;
        //     // $scope.isLoaded = true;
        //     $scope.noChange = false;
        //     $scope.isVisible = true;
        // }

        $scope.modify = function(competenceID, data) {

            $scope.editingData[competenceID + '-' + data.Id] = true;
            $scope.isVisible = false;
            $scope.isLoaded = true;

            if (!data.Category) {

                JSOMService.getInstructionCategory(data.Id).then(function(result) {
                    $scope.CategoryLoaded = true;
                    data.Category = result.Category;
                    $scope.isLoaded = false;

                });

            } else {
                $scope.isLoaded = false;
            }

        };

        $scope.saveCompetenceTraningDate = function(competence) {

            $scope.isLoaded = true;
            $scope.noChange = false;

            JSOMService.updateCompetenceDates(competence, $scope.employeeId).then(function(isNew) {
               $scope.editingData[competence.Id] = false;
               $scope.editingData[competence.Id + '-success'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;

                if (isNew) {
                    $scope.loading = true;
                    init();
                }

            }).catch(function() {

                $scope.editingData[competence.Id] = false;
                $scope.editingData[competence.Id + '-error'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;
                competence.TrainingDate = null;
                competence.ExpiryDate = null;
                
            });
        };

        $scope.updateInstructionDates = function(competenceID, data) {

            if (data.TrainingDate=== undefined || data.TrainingDate == "") {
                alert('please set the Date');
                return;
            }

            $scope.isLoaded = true;
            $scope.noChange = false;
            setInstructionRepeatDate(data);

            JSOMService.updateInstructionDates(data, $scope.employeeId).then(function(isNew) {
                $scope.editingData[competenceID + '-' + data.Id] = false;
                $scope.editingData[data.Id + '-success'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;

                if (isNew) {
                    $scope.loading = true;
                    init();
                }

                // $scope.reset(); 
            }).catch(function() {

                $scope.editingData[competenceID + '-' + data.Id] = false;
                $scope.editingData[data.Id + '-error'] = true;
                $scope.isLoaded = false;
                $scope.isVisible = true;
                data.TrainingDate = null;
                data.ExpiryDate = null;
                setInstructionRepeatDate(data);

            });
        };

        $scope.reset = function() {
            // delete $scope.editingData[competenceID + '-' + data.Id];
        };

        var setInstructionRepeatDate = function(i) {
            $scope.competences.forEach(function(competence) {

                competence.Instructions.forEach(function(instruction) {

                    if (instruction.Id === i.Id) {

                        var addNYears = function(date, n) {
                            var d = new Date(date);
                            d.setFullYear(d.getFullYear() + n);
                            return d.toJSON().slice(0, 10);
                        }

                        switch (i.Category) {
                            case "Cat. 1":
                                instruction.ExpiryDate = addNYears(i.TrainingDate, 1);
                                break;
                            case "Cat. 2":
                                instruction.ExpiryDate = addNYears(i.TrainingDate, 2);
                                break;
                            case "Cat. 3":
                                instruction.ExpiryDate = addNYears(i.TrainingDate, 3);
                                break;
                            default:
                                instruction.ExpiryDate = addNYears(i.TrainingDate, 99);

                        }



                    }
                });
            });
        };

        function getUrlVars() {
            var vars = {};
            var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
                vars[key] = value;
            });
            return vars.ID;
        }

        init();

        function init() {

            JSOMService.getSiteUrl().then(function(result) {
                $scope.siteUrl = result;

            });

            // var valuesToLoad = 3;
            JSOMService.getEmployeeCompetences($scope.employeeId).then(function(result) {
                $scope.competences = result;


            }).then(function() {

                var competenceIds = $scope.competences.map(function(competence) {
                    return competence.Id;
                });

                return JSOMService.getCompetenceInstructions(competenceIds).then(function(result) {

                    var resultLookup = result.reduce(function(lookup, instruction) {
                        lookup[instruction.Id] = instruction;
                        return lookup;
                    }, {});

                    $scope.competences.forEach(function(competence) {
                        var instruction = resultLookup[competence.Id];

                        if (instruction) {
                            competence.Instructions = instruction.Instructions; // added new key in object
                        }

                    });

                    JSOMService.getCompetencesDatesForEmployee($scope.employeeId).then(function(result) {
                                      
                    var resultLookup = result.reduce(function(lookup, competence) {
                        lookup[competence.CompetenceId] = competence;
                        return lookup;
                    }, {});

                        $scope.competences.forEach(function(obj) {

                            var competence = resultLookup[obj.Id];

                            if (competence) {
                                obj.ItemId = competence.ItemId;
                                obj.TrainingDate = competence.TrainingDate;
                                obj.ExpiryDate = competence.ExpiryDate;
                            } else {
                                obj.ItemId = null;
                                obj.TrainingDate = undefined;
                                obj.ExpiryDate = null;
                            }

                        });
                    
                });

                });

                 





            }).then(function() {

                JSOMService.getInstructionsDatesForEmployee($scope.employeeId).then(function(result) {


                    var resultLookup = result.reduce(function(lookup, instructionDate) {
                        lookup[instructionDate.InstructieId] = instructionDate;
                        return lookup;
                    }, {});


                    for (var i = 0; i < $scope.competences.length; i++) {

                        var instructions = $scope.competences[i].Instructions;

                        instructions.forEach(function(obj) {

                            var instructionDate = resultLookup[obj.Id];

                            if (instructionDate) {
                                obj.ItemId = instructionDate.ItemId;
                                obj.TrainingDate = instructionDate.TrainingDate;
                                obj.ExpiryDate = instructionDate.ExpiryDate;
                            } else {
                                obj.ItemId = null;
                                obj.TrainingDate = undefined;
                                obj.ExpiryDate = null;
                            }

                        });
                    };

                });

           
                $scope.loading = false;
            });
            
        }
    }
})();
