/*
 * Copyright (c) 2016 Open Baton (http://www.openbaton.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var app = angular.module('app').controller('VnfdCtrl', function ($scope, $compile, $cookieStore, $routeParams, http, $http, $window, AuthService, clipboard, $interval, NgTableParams, $filter) {

    var baseUrl = $cookieStore.get('URL') + "/api/v1/";
    var url = baseUrl + '/vnf-descriptors/';
    var urlVim = baseUrl + '/datacenters';
    var defaultvdu = {
        version: 0,
        name: "",
        vm_image: [],
        vimInstanceName: [],
        scale_in_out: 2,
        vnfc: [{version: "0", connection_point: []}]
    };
    var defaultVNFD = {
        vendor: "",
        version: "",
        name: "",
        type: "",
        endpoint: "generic",
        monitoring_parameter: [],
        vdu: [],
        virtual_link: [],
        lifecycle_event: [],
        deployment_flavour: [{"flavour_key": "m1.small"}],
        auto_scale_policy: [],
        configurations: {name: "", configurationParameters: []}
    };
    $scope.custom_images = [];
    $scope.lifecycle_event_type = ["INSTANTIATE", "CONFIGURE", "START", "TERMINATE", "SCALE_IN"];
    //$interval(loadTable, 2000);
    loadTable();

    $scope.alerts = [];
    $scope.vimInstances = [];
    http.get(urlVim)
        .success(function (response, status) {
            $scope.vimInstances = response;
            console.log(response);
        })
        .error(function (data, status) {
            showError(data, status);

        });

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.copyToClipboard = function () {
        var ids = [];
        angular.forEach($scope.selection.ids, function (value, k) {
            if (value) {
                ids.push({'id': k});
            }
        });
        //console.log(ids);
        clipboard.copyText(JSON.stringify(ids));
    };


    if (!angular.isUndefined($routeParams.vduId)) {
        $scope.vduId = $routeParams.vduId;
        console.log($scope.vduId);
    }

    $scope.deleteMPfromVNFD = function (index) {
        $scope.vnfdCreate.monitoring_parameter.splice(index, 1);
    };
    $scope.addVDUtoVND = function () {
        $('#addEditVDU').modal('hide');
        if (!angular.isUndefined($scope.vduEditIndex)) {
            $scope.vnfdCreate.vdu.splice($scope.vduEditIndex, 1);
            delete $scope.vduEditIndex;
        }
        $scope.vnfdCreate.vdu.push(angular.copy($scope.vduCreate));
    };
    $scope.storeDepFlavour = function () {
        $('#modaladdDepFlavour').modal('hide');
        if (!angular.isUndefined($scope.dfEditIndex)) {
            $scope.vnfdCreate.deployment_flavour.splice($scope.dfEditIndex, 1);
            delete $scope.dfEditIndex;
        }
        $scope.vnfdCreate.deployment_flavour.push(angular.copy($scope.depFlavor));
    };

    $scope.selectionImage = [];

    $scope.toggleSelection = function toggleSelection(image) {
        console.log(({}).toString.call($scope.selection).match(/\s([a-zA-Z]+)/)[1].toLowerCase())
        var idx = $scope.selectionImage.indexOf(image);
        if (idx > -1) {
            $scope.selectionImage.splice(idx, 1);
        }
        else {
            $scope.selectionImage.push(image);
        }
        console.log($scope.selectionImage);
        $scope.vduCreate.vm_image = $scope.selectionImage;
    };

    $scope.sendVNFD = function () {
        $('#addEditVNDF').modal('hide');

        http.post(url, $scope.vnfdCreate)
            .success(function (response, status) {
                showOk('Virtual Network Function saved.');
                console.log(response);
                loadTable();
            })
            .error(function (data, status) {
                showError(data, status);

            });
        console.log($scope.vnfdCreate);

    };

    $scope.deleteMP = function (index) {
        $scope.vduCreate.monitoring_parameter.splice(index, 1);
    };

    $scope.saveValueMP = function (newValue) {
        console.log(newValue);
        $scope.vduCreate.monitoring_parameter.push(newValue);
    };
    $scope.saveValueMPfromVNFD = function (newValue) {
        console.log(newValue);
        if (newValue.length <= 0) {
            return;
        }
        ;
        $scope.vnfdCreate.monitoring_parameter.push(newValue);
    };
    $scope.editVDU = function (vnfd, index) {
        $scope.vduCreate = vnfd;
        $scope.vduEditIndex = index;
        $('#addEditVDU').modal('show');
    };

    $scope.saveValueCVDU = function (newValue) {
        console.log(newValue);
        $scope.depFlavor.costituent_vdu.push(newValue);
    };
    $scope.saveValueDFC = function (newValue) {
        console.log(newValue);
        $scope.depFlavor.df_constraint.push(newValue);
    };

    $scope.deleteVDU = function (index) {
        $scope.vnfdCreate.vdu.splice(index, 1);
    };
    $scope.editDF = function (df, index) {
        $scope.depFlavor = df;
        $scope.dfEditIndex = index;
        $('#modaladdDepFlavour').modal('show');
    };

    $scope.deleteDF = function (index) {
        $scope.vnfdCreate.deployment_flavour.splice(index, 1);
    };
    $scope.saveValueVMI = function (newValue) {
        console.log(newValue);
        $scope.vduCreate.vm_image.push(newValue);
    };

    $scope.addDepFlavour = function () {
        $scope.vnfdCreate.deployment_flavour.push({flavour_key: ""});
    };

    $scope.addVDU = function () {

        $scope.vduCreate = angular.copy(defaultvdu);
        //$scope.vduCreate.vimInstanceName.push($scope.vimInstances[0].name);
        $('#addEditVDU').modal('show');
    };

    $scope.showTab = function (value) {
        return (value > 0);
    };
    $scope.addVNFC = function () {
        var newVnfc = {version: "0", connection_point: [{floatingIp: "random", virtual_link_reference: "private"}]};
        $scope.vduCreate.vnfc.push(newVnfc);
    };
    $scope.addConnection = function (data) {
        data.connection_point.push({floatingIp: "random", virtual_link_reference: "private"});
    };
    $scope.removeVNFC = function (index) {
        $scope.vduCreate.vnfc.splice(index, 1);
    };
    $scope.removeConnection = function (data, index) {
        data.connection_point.splice(index, 1);
    };
    $scope.saveImageName = function (name) {
        $scope.custom_images.push(name);

    };
    $scope.clearVduVims = function () {
        $scope.vduCreate.vimInstanceName = [];
        $scope.vduCreate.vm_image = [];
        $scope.selectionImage = [];
        console.log($scope.selection);
    };
    $scope.deleteVL = function (index) {
        $scope.vnfdCreate.virtual_link.splice(index, 1);
    };
    $scope.addVL = function () {
        $scope.vnfdCreate.virtual_link.push({name: ""});
    };

    $scope.addLifecycleEvent = function () {
        $scope.vnfdCreate.lifecycle_event.push({event: "", lifecycle_events: []});
        console.log($scope.vnfdCreate.lifecycle_event);
    };
    $scope.removeLifecycleEvent = function (index) {
        $scope.vnfdCreate.lifecycle_event.splice(index, 1);
    };
    $scope.addScript = function (index) {
        $scope.vnfdCreate.lifecycle_event[index].lifecycle_events.push("skript_name");
    };
    $scope.removeScript = function (event, index) {
        event.lifecycle_events.splice(index, 1);

    };
    $scope.addConfPar = function () {
        $scope.vnfdCreate.configurations.configurationParameters.push({confKey: "", value: ""});
    };
    $scope.removeConf = function (index) {
        $scope.vnfdCreate.configurations.configurationParameters.splice(index, 1);
    };

    $scope.addMonitoringParameter = function () {
        $scope.vnfdCreate.monitoring_parameter.push("");
    };
    $scope.removeMonitoringParameter = function (index) {
        $scope.vnfdCreate.monitoring_parameter.splice(index, 1);
    };

    $scope.addVNFD = function () {
        $http.get('descriptors/vnfd/vnfd.json')
            .then(function (res) {
                console.log(res.data);
                $scope.vnfdCreate = angular.copy(defaultVNFD);
            });
        $('#addEditVNDF').modal('show');
    };

    $scope.deleteVNFD = function (data) {
        http.delete(url + data.id)
            .success(function (response, status) {
                showOk('Virtual Network Function deleted.');
                loadTable();
            })
            .error(function (data, status) {
                showError(data, status);

            });
    };

    /* -- multiple delete functions Start -- */

    $scope.multipleDeleteReq = function () {
        var ids = [];
        angular.forEach($scope.selection.ids, function (value, k) {
            if (value) {
                ids.push(k);
            }
        });
        console.log(ids);
        http.post(url + 'multipledelete', ids)
            .success(function (response) {
                showOk('Virtual Network Function Descriptor with id: ' + ids.toString() + ' deleted.');
                loadTable();
            })
            .error(function (response, status) {
                showError(response, status);
            });
        $scope.multipleDelete = false;
        $scope.selection = {};
        $scope.selection.ids = {};

    };

    $scope.main = {checkbox: false};
    $scope.$watch('main', function (newValue, oldValue) {
        //console.log(newValue.checkbox);
        //console.log($scope.selection.ids);
        angular.forEach($scope.selection.ids, function (value, k) {
            $scope.selection.ids[k] = newValue.checkbox;
        });
        console.log($scope.selection.ids);
    }, true);

    $scope.$watch('selection', function (newValue, oldValue) {
        console.log(newValue);
        var keepGoing = true;
        angular.forEach($scope.selection.ids, function (value, k) {
            if (keepGoing) {
                if ($scope.selection.ids[k]) {
                    $scope.multipleDelete = false;
                    keepGoing = false;
                }
                else {
                    $scope.multipleDelete = true;
                }
            }

        });
        if (keepGoing)
            $scope.mainCheckbox = false;
    }, true);

    $scope.multipleDelete = true;

    $scope.selection = {};
    $scope.selection.ids = {};
    /* -- multiple delete functions END -- */

    function loadTable() {
        if (angular.isUndefined($routeParams.vnfdescriptorId))
            http.get(url)
                .success(function (response, status) {
                    $scope.vnfdescriptors = response;
                    //console.log(response);
                })
                .error(function (data, status) {
                    showError(data, status);

                });
        else {
            if (angular.isUndefined($routeParams.vduId)) {
                // console.log('in vnfd' + $routeParams);
                http.get(url + $routeParams.vnfdescriptorId)
                    .success(function (response, status) {
                        $scope.vnfdinfo = response;
                        $scope.vnfdJson = JSON.stringify(response, undefined, 4);
                        //console.log($scope.vnfdJson);
                    })
                    .error(function (data, status) {
                        showError(data, status);

                    });
                $scope.vnfdescriptorId = $routeParams.vnfdescriptorId;
            }
            else {
                //console.log('in vdu');
                http.get(url + $routeParams.vnfdescriptorId + '/vdus/' + $routeParams.vduId)
                    .success(function (response, status) {
                        $scope.vdu = response;
                        $scope.vduPageJson = JSON.stringify(response, undefined, 4);
                        console.log($scope.vdu);
                    })
                    .error(function (data, status) {
                        showError(data, status);

                    });
            }
        }
    }

    function showError(data, status) {
        if (status === 500) {
            $scope.alerts.push({
                type: 'danger',
                msg: 'An error occured and could not be handled properly, please, report to us and we will fix it as soon as possible'
            });
        } else {
            console.log('Status: ' + status + ' Data: ' + JSON.stringify(data));
            $scope.alerts.push({
                type: 'danger',
                msg: data.message + " Code: " + status
            });
        }

        $('.modal').modal('hide');
        if (status === 401) {
            console.log(status + ' Status unauthorized')
            AuthService.logout();
        }
    }

    function showOk(msg) {
        $scope.alerts.push({type: 'success', msg: msg});
        window.setTimeout(function () {
            for (i = 0; i < $scope.alerts.length; i++) {
                if ($scope.alerts[i].type == 'success') {
                    $scope.alerts.splice(i, 1);
                }
            }
        }, 5000);
        loadTable();
        $('.modal').modal('hide');
    }

    $('.modal-dialog').draggable();

    var paginationVNF = []
    $scope.tableParamspaginationVNF = new NgTableParams({
            page: 1,
            count: 10,
            sorting: {
                name: 'asc'     // initial sorting
            },
            filter: {name: ""},
        },
        {
            counts: [],
            total: paginationVNF.length,
            getData: function (params) {
                paginationVNF = params.sorting() ? $filter('orderBy')($scope.vnfdescriptors, params.orderBy()) : $scope.vnfdescriptors;
                paginationVNF = params.filter() ? $filter('filter')(paginationVNF, params.filter()) : paginationNSD;
                $scope.tableParamspaginationVNF.total(paginationVNF.length);
                paginationVNF = paginationVNF.slice((params.page() - 1) * params.count(), params.page() * params.count());
                for (i = paginationVNF.length; i < params.count(); i++) {
                }
                return paginationVNF;
            }
        });
// VNFD JSON modal Starts
    $scope.prettyJson = function (vnfdJson) {
        $scope.vnfdJson = vnfdJson;
        $scope.jsonrendVNFD()
    }
    $scope.jsonrendVNFD = function () {
        renderjson.set_icons('+', '-');
        renderjson.set_show_to_level(1);
        var jsonDiv = document.querySelector("#jsonvnfd");
        jsonDiv.append(
            renderjson($scope.vnfdinfo)
        );
    }
    $('#JsonCode').on('hidden.bs.modal', function () {
        var jsonDiv = document.querySelector("#jsonvnfd");
        jsonDiv.childNodes[0].remove();
        jsonDiv.childNodes[0].remove();
    });
    // to Store current page into local storage
    if (typeof(Storage) !== "undefined") {
        // Store
        localStorage.setItem("LastURL", location.href);
    } else {
        document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Storage...";
    }
    // Wizard Function
    +function ($) {
        'use strict';

        var modals = $('.modal.multi-step');

        modals.each(function (idx, modal) {
            var $modal = $(modal);
            var $buttons = $modal.find('button.step');
            var total_num_steps = $buttons.length;
            var $progress = $modal.find('.m-progress');
            var $progress_bar = $modal.find('.m-progress-bar');
            var $progress_stats = $modal.find('.m-progress-stats');
            var $progress_current = $modal.find('.m-progress-current');
            var $progress_total = $modal.find('.m-progress-total');
            var $progress_complete = $modal.find('.m-progress-complete');
            var reset_on_close = $modal.attr('reset-on-close') === 'true';

            function reset() {
                $modal.find('.step').hide();
                $modal.find('[data-step]').hide();
            }

            function completeSteps() {
                $progress_stats.hide();
                $progress_complete.show();
                $modal.find('.progress-text').animate({
                    top: '-2em'
                });
                $modal.find('.complete-indicator').animate({
                    top: '-2em'
                });
                $progress_bar.addClass('completed');
            }

            function getPercentComplete(current_step, total_steps) {
                return Math.min(current_step / total_steps * 200, 100) + '%';
            }

            function updateProgress(current, total) {
                $progress_bar.animate({
                    width: getPercentComplete(current, total)
                });
                if (current - 1 >= total_num_steps) {
                    completeSteps();
                } else {
                    $progress_current.text(current);
                }

                $progress.find('[data-progress]').each(function () {
                    var dp = $(this);
                    if (dp.data().progress <= current - 1) {
                        dp.addClass('completed');
                    } else {
                        dp.removeClass('completed');
                    }
                });
            }

            function goToStep(step) {
                reset();
                var to_show = $modal.find('.step-' + step);
                if (to_show.length === 0) {
                    // at the last step, nothing else to show
                    return;
                }
                to_show.show();
                var current = parseInt(step, 10);
                updateProgress(current, total_num_steps);
                findFirstFocusableInput(to_show).focus();
            }

            function findFirstFocusableInput(parent) {
                var candidates = [parent.find('input'), parent.find('select'),
                        parent.find('textarea'), parent.find('button')],
                    winner = parent;
                $.each(candidates, function () {
                    if (this.length > 0) {
                        winner = this[0];
                        return false;
                    }
                });
                return $(winner);
            }

            function bindEventsToModal($modal) {
                var data_steps = [];
                $('[data-step]').each(function () {
                    var step = $(this).data().step;
                    if (step && $.inArray(step, data_steps) === -1) {
                        data_steps.push(step);
                    }
                });

                $.each(data_steps, function (i, v) {
                    $modal.on('next.m.' + v, {step: v}, function (e) {
                        goToStep(e.data.step);
                    });
                });
            }

            function initialize() {
                reset();
                updateProgress(1, total_num_steps);
                $modal.find('.step-1').show();
                $progress_complete.hide();
                $progress_total.text(total_num_steps);
                bindEventsToModal($modal, total_num_steps);
                $modal.data({
                    total_num_steps: $buttons.length,
                });
                if (reset_on_close) {
                    //Bootstrap 2.3.2
                    $modal.on('hidden', function () {
                        reset();
                        $modal.find('.step-1').show();
                    })
                    //Bootstrap 3
                    $modal.on('hidden.bs.modal', function () {
                        reset();
                        $modal.find('.step-1').show();
                    })
                }
            }

            initialize();
        })
    }(jQuery);
    sendEvent = function (sel, step) {
        $(sel).trigger('next.m.' + step);
    }
// Wizard Functions ends here

// VNFD JSON Starts
});
app.filter('clearText', function () {
    return function (text) {
        return text ? String(text).replace(/"<[^>]+>/gm, '') : '';
    }
});