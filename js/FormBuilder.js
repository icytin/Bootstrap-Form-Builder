/*! FormBuilder v 1.0 by icytin. Created 2014-05-27
*/

var FormBuilder = function ($) {
    //== Private variables ==

    //== Initializer ==
    $(function () {
    
      // Uncomment the line below if changes are made in the component html´s
      // $.ajaxSetup ({cache: false});

      $('#inputs').load('components/inputs.html', function() {
        $('#radioscheckboxes').load('components/radioscheckboxes.html', function() {
          $('#select').load('components/select.html', function() {
            $('#buttons').load('components/buttons.html', function() {
              init();
            });
          });
        });
      });
      
      $('#mainWizard').bootstrapWizard({onTabShow: function(tab, navigation, index) {
        var $total = navigation.find('li').length;
        var $current = index+1;
        var $percent = ($current/$total) * 100;
        $('#mainWizard').find('.progress-bar').css({width:$percent+'%'}).find('span').html($percent.toString().split('.')[0] + '%');
      }});
    });

    //== Private functions ==
    var init = function() {
      SourceHandler.init();
      TargetHandler.init();
      ComponentActionHandler.init();
      initTextArea();
      FileSaver.init();
      PageBuilder.init();
    }
    
    var initTextArea = function() {
      $('#formSource').on('change', function() {
        $(this).css('height', 'auto' );
        $(this).height( this.scrollHeight );
      });
    }
    
    // ==== Source ==== 
    var SourceHandler = function() {
      
      var initDraggable = function() {
      
        var sourceSortableIn;
        $(".sourceHolder").sortable({
          connectWith: ".connectedSortable",
          over: function(e, ui) { sourceSortableIn = true; },
          out: function(e, ui) { sourceSortableIn = false; },
          helper: function (e, div) {
            this.copyHelper = div.clone().insertAfter(div);
            $(this).data('copied', false);
            $(contextMenu).hide();

            return div.clone();
          },
          stop: function () {
            var copied = $(this).data('copied');
            if (!copied) {
              this.copyHelper.remove();
            }
            if(!copied && (!sourceSortableIn || sourceSortableIn !== undefined)) {
              if($('div.active').find('label:contains("' + this.copyHelper.find('label').html() + '")').length === 0) {
                $('div.active').append(this.copyHelper.clone()); 
              }
            }
            this.copyHelper = null;
          }
        });
      }
      
      return {
        init: function() {
          initDraggable();
        }
      };
    }(jQuery);
    
    // ==== Target ====
    var TargetHandler = function() {
    
      var initDraggable = function() {
        var targetSortableIn;
        $("#target").sortable({
            over: function(e, ui) { targetSortableIn = true; },
            out: function(e, ui) { targetSortableIn = false; },
            receive: function (e, ui) {
                ui.sender.data('copied', true);
                MarkupHandler.refresh();
            },
            helper: function (e, div) {
              $(contextMenu).hide();
              return div;
            },
            beforeStop: function (event, ui) {
              if (!targetSortableIn) {
                ui.item.remove();
              }
            },
            stop: function () {
              this.copyHelper = null;
              MarkupHandler.refresh();
            },
            cancel: ".ui-state-disabled"
        });
      }
      
      return {
        init: function() {
          initDraggable();
          MenuHandler.initContextMenu('#formVisualizer form', '#target, legend' );
        }
      };
    }(jQuery);
    
    // ==== Menu ====
    var MenuHandler = function() {
    
      var $target;
    
      return {
        initContextMenu: function(section, action) {
          
          if(section === undefined || action === undefined || section.length === 0 || action.length === 0) {
            alert('Context menu plugin is not correctly initialized');
            return;
          }
        
          var $contextMenu = $("#contextMenu");
          
          $(section).on("contextmenu", action, function(e) {
            if($('.highLight').length !== 0){ // No menu available in edit mode
              return false;
            }
            
            $target = $(e.target);
            if(($target.parents('div.form-group').length === 0 && !$target.hasClass('form-group'))) {
              // hide all
              $('#edit').hide();
              $('#validationRules').hide();
              $('#contextMenu li.divider').hide();
              
              // special case
              if($target.is('legend')) {
                $('#edit').show();
              }
            }
            else {
              $('#edit').show();
              $('#validationRules').show();
              $('#contextMenu li.divider').show();
            }
          
            $contextMenu.css({
              display: "block",
              left: e.pageX,
              top: e.pageY
            });
            return false;
          });
          
          $contextMenu.on("click", "a", function(e) {
            switch($(this).prop('id'))
            {
              case 'edit':
                ComponentActionHandler.edit($target);
                break;
              case 'validationRules':
                alert("TODO: Handle validation rules");
                break;
              case 'clearForm':
                
                $('#confirm-modal').modal();
                $('#confirmButton').unbind('click').click(function() {
                  $(section).find('#target').html('');
                  $(section).find('legend').html('New Form');
                  MarkupHandler.refresh();
                });
                
                break;
              default:
                break;
            }
            
            $contextMenu.hide();
          });
          
          $(document).click(function(event) {
            if(!$(event.target).closest(contextMenu).length) {
              if($(contextMenu).is(":visible")) {
                $(contextMenu).hide();
              }
            }
            
            return true;
          });
        }
      };
    }(jQuery);
    
    var GeneralSortableHandler = function() {
      return {
        setSortableSection: function(sectionSelector, sortable) {
          if(sortable) {
            $(sectionSelector).removeClass('ui-state-disabled');
            $('.form-group, .form-group label').css('cursor', 'pointer');
          }
          else {
            $(sectionSelector).addClass('ui-state-disabled');
            $('.form-group, .form-group label').css('cursor', 'default');
          }
        }
      };
    }(jQuery);
    
    var ComponentActionHandler = function() {
    
      var currentTarget;
      
      return {
        init: function() {
          $('#formVisualizer').on('click', function(e) {
            var $target = $(e.target);
            if($target.prop('id') === 'editConfirm') {
              TemplateHandler.getActionFunction();
            }
            else if($target.prop('id') === 'editAbort') {
              
            }
            
            if($target.prop('id') === 'editAbort' || $target.prop('id') === 'editConfirm') {
              GeneralSortableHandler.setSortableSection('#target .form-group', true);
              $('#editForm').remove();
              $('.highLight').removeClass('highLight');
              MarkupHandler.refresh();
            }
            
            if($target.is('input')) { // Add those that should not be disabled..
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            return false;
            
          });
        },
        edit: function(target) {
          var t = target.hasClass('form-group') ? target : target.parents('div.form-group');
          currentTarget = t;
          var cs = t.getComments(true);
          var c = cs.length === 0 ? undefined : cs[0].trim().toLowerCase();
          switch(c)
          {
            /* Inputs ========================= */
            case 'text input':
              InputHandler.textInput(t);
              break;
            case 'password input':
              InputHandler.passwordInput(t);
            break;
            case 'prepend text':
              InputHandler.prependOrAppendTextInput(t, 'Prepend');
            break;
            case 'append text':
              InputHandler.prependOrAppendTextInput(t, 'Append');
            break;
            case 'prepend checkbox':
              InputHandler.prependOrAppendCheckbox(t, 'Prepend');
            break;
            case 'append checkbox':
              InputHandler.prependOrAppendCheckbox(t, 'Append');
            break;
            case 'button dropdown':
              InputHandler.buttonDropdown(t);
            break;
            case 'textarea':
              InputHandler.textArea(t);
            break;
            /* Radio and checkboxes =============== */
            case 'inline radios':
            case 'multiple radios':
            case 'inline checkbox':
            case 'multiple checkboxes':
              RadioAndCheckboxHandler.init(t);
            break;
            /* Select ========================= */
            case 'select single':
            case 'select multiple':
              SelectHandler.init(t);
            break;
            /* Buttons ======================== */
            case 'file button':
              ButtonHandler.fileButton(t);
            break;
            case 'single button':
              ButtonHandler.singleButton(t);
            break;
            case 'double button':
              ButtonHandler.doubleButton(t);
            break;
            case 'button group':
              ButtonHandler.buttonGroup(t);
            break;
            default:
              // Special cases
              if(target.is('legend')) {
                OtherComponentsHandler.legend(target);
              }
              
              break;
          }
        },
        getCurrentTarget: function() {
          return currentTarget;
        }
      }
    }(jQuery);
    
    var ButtonHandler = function() {
      
      return {
        fileButton: function(target) {
          TemplateHandler.getEditForm(target.find('label').html()).insertAfter(target);
          $('#editForm').append(TemplateHandler.getInput('idInput', 'ID / Name', target.find('input').prop('id')));
          $('#editForm').append(TemplateHandler.getInput('labelInput', 'Label Text', target.find('label').html()));
          $('#editForm').append(TemplateHandler.getInput('helpblockInput', 'Help Text', target.find('p.help-block').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('labelSizeSelect', 'Label Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'label')));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('inputSizeSelect', 'Input Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'input')));
          
          TemplateHandler.init(function() {
            var t = ComponentActionHandler.getCurrentTarget();
            var $editForm = $('#editForm');
            if($editForm.find('#idInput').val() !== '') {
              t.find('input').attr('id', $editForm.find('#idInput').val()).attr('name', $editForm.find('#idInput').val());
            }
            if($('#labelInput').val() !== '') {
              t.find('label:first').html($('#labelInput').val());
            }
            
            target.find('p.help-block').html($('#helpblockInput').val());
            TemplateHandler.updateSize(target.find('label:eq(0)'), $('#labelSizeSelect').val()); // label
            TemplateHandler.updateSize(target.find('input').parents('div[class^="col-"]').first(), $('#inputSizeSelect').val()); // input
          });
        },
        singleButton: function(target) {
          TemplateHandler.getEditForm(target.find('label').html()).insertAfter(target);
          $('#editForm').append(TemplateHandler.getInput('labelInput', 'Label Text', target.find('label').html()));
          $('#editForm').append(TemplateHandler.getInput('idInput', 'ID / Name', target.find('button').prop('id')));
          $('#editForm').append(TemplateHandler.getInput('buttonLabelInput', 'Button Text', target.find('button').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('buttonTypeSelect', 'Button Type', ['Default', 'Primary', 'Success', 'Info', 'Warning', 'Danger'], target.find('button').prop('class').split(' ')[1].split('-')[1]));
          $('#editForm').append(TemplateHandler.getInput('helpblockInput', 'Help Text', target.find('p.help-block').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('labelSizeSelect', 'Label Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'label')));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('inputSizeSelect', 'Input Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'button')));
          
          
          TemplateHandler.init(function() {
            var t = ComponentActionHandler.getCurrentTarget();
            
            var inputSelector = 'button';
          
            var $editForm = $('#editForm');
            if($editForm.find('#idInput').val() !== '') {
              t.find(inputSelector).attr('id', $editForm.find('#idInput').val()).attr('name', $editForm.find('#idInput').val());
            }
            if($('#labelInput').val() !== '') {
              t.find('label').html($('#labelInput').val()).prop('for', $editForm.find('#idInput').val());
            }
            if($('#placeholderInput').val() !== '') {
              t.find(inputSelector).attr('placeholder', $('#placeholderInput').val());
            }
            
            if($('#buttonLabelInput').val() !== '') {
              t.find(inputSelector).html($('#buttonLabelInput').val());
            }
            
            t.find(inputSelector).removeClass().addClass('btn btn-' + $('#buttonTypeSelect').val().toLowerCase());
            t.find('p.help-block').html($('#helpblockInput').val());
            
            TemplateHandler.updateSize(t.find('label'), $('#labelSizeSelect').val()); // label
            TemplateHandler.updateSize(t.find(inputSelector).parents('div[class^="col-"]').first(), $('#inputSizeSelect').val()); // input
          });
        },
        doubleButton: function(target) {
          TemplateHandler.getEditForm(target.find('label').html()).insertAfter(target);
          $('#editForm').append(TemplateHandler.getInput('labelInput', 'Label Text', target.find('label').html()));
          $('#editForm').append(TemplateHandler.getInput('idInput', 'Button 1 ID / Name', target.find('button').prop('id')));
          $('#editForm').append(TemplateHandler.getInput('buttonLabelInput', 'Button 1 Text', target.find('button').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('buttonTypeSelect', 'Button 1 Type', ['Default', 'Primary', 'Success', 'Info', 'Warning', 'Danger'], target.find('button').prop('class').split(' ')[1].split('-')[1]));
          
          // Second button
          $('#editForm').append(TemplateHandler.getInput('idInput2', 'Button 2 ID / Name', target.find('button:eq(1)').prop('id')));
          $('#editForm').append(TemplateHandler.getInput('buttonLabelInput2', 'Button 2 Text', target.find('button:eq(1)').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('buttonTypeSelect2', 'Button 2 Type', ['Default', 'Primary', 'Success', 'Info', 'Warning', 'Danger'], target.find('button:eq(1)').prop('class').split(' ')[1].split('-')[1]));
          
          $('#editForm').append(TemplateHandler.getInput('helpblockInput', 'Help Text', target.find('p.help-block').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('labelSizeSelect', 'Label Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'label')));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('inputSizeSelect', 'Input Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'button')));
          
          
          TemplateHandler.init(function() {
            var t = ComponentActionHandler.getCurrentTarget();
            
            var inputSelector = 'button';
          
            var $editForm = $('#editForm');
            if($editForm.find('#idInput').val() !== '') {
              t.find(inputSelector).attr('id', $editForm.find('#idInput').val()).attr('name', $editForm.find('#idInput').val());
            }
            if($('#buttonLabelInput').val() !== '') {
              t.find(inputSelector).html($('#buttonLabelInput').val());
            }
            t.find(inputSelector).removeClass().addClass('btn btn-' + $('#buttonTypeSelect').val().toLowerCase());
            
            // Second button
            if($editForm.find('#idInput2').val() !== '') {
              t.find(inputSelector + ':eq(1)').attr('id', $editForm.find('#idInput2').val()).attr('name', $editForm.find('#idInput2').val());
            }
            if($('#buttonLabelInput2').val() !== '') {
              t.find(inputSelector + ':eq(1)').html($('#buttonLabelInput2').val());
            }
            t.find(inputSelector + ':eq(1)').removeClass().addClass('btn btn-' + $('#buttonTypeSelect2').val().toLowerCase());
            
            // Others..
            if($('#labelInput').val() !== '') {
              t.find('label').html($('#labelInput').val()).prop('for', $editForm.find('#idInput').val());
            }
            
            t.find('p.help-block').html($('#helpblockInput').val());
            
            TemplateHandler.updateSize(t.find('label'), $('#labelSizeSelect').val()); // label
            TemplateHandler.updateSize(t.find(inputSelector).parents('div[class^="col-"]').first(), $('#inputSizeSelect').val()); // input
          });
        },
        buttonGroup: function(target) {
          TemplateHandler.getEditForm(target.find('label').html()).insertAfter(target);
          $('#editForm').append(TemplateHandler.getInput('labelInput', 'Label Text', target.find('label').html()));
          $('#editForm').append(TemplateHandler.getInput('helpblockInput', 'Help Text', target.find('p.help-block').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('labelSizeSelect', 'Label Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'label')));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('inputSizeSelect', 'Input Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'button')));
          $('#editForm').append(TemplateHandler.createTextArea('buttonNamesArea', 'Button Names', []));
          $('#editForm').append(TemplateHandler.createTextArea('buttonValuesArea', 'Button ID´s / Names', []));
          
          var buttons = target.find('button');
          var vButtonNames = '', vButtonValues = '', length = buttons.length;
          $.each(buttons, function(i, val) {
            vButtonNames += $(val).html().trim();
            vButtonValues += $(val).prop('id');
            if(i !== length - 1) {
              vButtonNames += '\r\n';
              vButtonValues += '\r\n';
            }
          });
          
          $('#buttonNamesArea').val(vButtonNames).prop('rows', buttons.length === 1 ? 2 : buttons.length + 1);
          $('#buttonValuesArea').val(vButtonValues).prop('rows', buttons.length === 1 ? 2 : buttons.length + 1);
          
          TemplateHandler.init(function() {
            var t = ComponentActionHandler.getCurrentTarget();
            
            if($('#labelInput').val() !== '') {
              t.find('label').html($('#labelInput').val()).prop('for', $('#idInput').val());
            }
            
            t.find('p.help-block').html($('#helpblockInput').val());            
            TemplateHandler.updateSize(t.find('label'), $('#labelSizeSelect').val()); // label
            TemplateHandler.updateSize(t.find('.btn-group').parents('div[class^="col-"]').first(), $('#inputSizeSelect').val()); // input
            
            target.find('.btn-group').html('');
            var values = $('#buttonValuesArea').val().split('\n');
            $.each($('#buttonNamesArea').val().split('\n'), function(i, val) {
              $button = $('<button type="button" class="btn btn-default">' + val + '</button>');
              var id = i <= values.length - 1 ? values[i] : '';
              $button.prop('id', id).prop('value', id);
              target.find('.btn-group').append($button);
            });
            
          });
        }
      };
    }(jQuery);
    
    var SelectHandler = function() {
      
      var initGeneral = function(target) {       
        TemplateHandler.getEditForm(target.find('label').html()).insertAfter(target);
        $('#editForm').append(TemplateHandler.getInput('idInput', 'ID / Name', target.find('select').prop('id')));
        $('#editForm').append(TemplateHandler.getInput('labelInput', 'Label Text', target.find('label').html()));
        $('#editForm').append(TemplateHandler.getInput('helpblockInput', 'Help Text', target.find('p.help-block').html()));
        $('#editForm').append(TemplateHandler.createSelectboxSingle('labelSizeSelect', 'Label Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'label')));
        $('#editForm').append(TemplateHandler.createSelectboxSingle('inputSizeSelect', 'Input Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'select')));
        
        // Option and values
        $('#editForm').append(TemplateHandler.createTextArea('optionsArea', 'Options', []));
        $('#editForm').append(TemplateHandler.createTextArea('valuesArea', 'Values', []));
        var options = target.find('select option');
        var vOpt = '', vVal = '', length = options.length;
        $.each(options, function(i, val) {
          vOpt += $(val).html().trim()
          vVal += $(val).prop('value');
          if(i !== length - 1) {
            vOpt += '\r\n';
            vVal += '\r\n';
          }
        });
        
        $('#optionsArea').val(vOpt).prop('rows', options.length === 1 ? 2 : options.length + 1);
        $('#valuesArea').val(vVal).prop('rows', options.length === 1 ? 2 : options.length + 1);
      };
      
      return {
        init: function(target) {
          initGeneral(target);
        
          TemplateHandler.init(function() {
            SelectHandler.defaultApplyCode(ComponentActionHandler.getCurrentTarget());
          });
        },
        defaultApplyCode: function(target) {
          var $editForm = $('#editForm');
          if($editForm.find('#idInput').val() !== '') {
            target.find('select').attr('id', $editForm.find('#idInput').val()).attr('name', $editForm.find('#idInput').val());
          }
          if($('#labelInput').val() !== '') {
            target.find('label:first').html($('#labelInput').val());
          }
          
          target.find('p.help-block').html($('#helpblockInput').val());
          TemplateHandler.updateSize(target.find('label'), $('#labelSizeSelect').val()); // label
          TemplateHandler.updateSize(target.find('select').parents('div[class^="col-"]').first(), $('#inputSizeSelect').val()); // input
          
          target.find('select').html('');
          var values = $('#valuesArea').val().split('\n');
          $.each($('#optionsArea').val().split('\n'), function(i, val) {
            $option = $('<option>' + val + '</option>');
            $option.prop('value', i <= values.length - 1 ? values[i] : '');
            target.find('select').append($option);
          });
        }
      };
    }(jQuery);
    
    var RadioAndCheckboxHandler = function() {
    
      var initGeneral = function(target) {
        var inputSelector = target.find('input[type="radio"]').length !== 0 ? 'input[type="radio"]' : 'input[type="checkbox"]';
        
        TemplateHandler.getEditForm(target.find('label').html()).insertAfter(target);
        $('#editForm').append(TemplateHandler.getInput('groupInput', 'Group Name', target.find(inputSelector).prop('name')));
        $('#editForm').append(TemplateHandler.getInput('labelInput', 'Label Text', target.find('label').html()));
        $('#editForm').append(TemplateHandler.getInput('helpblockInput', 'Help Text', target.find('p.help-block').html()));
        $('#editForm').append(TemplateHandler.createSelectboxSingle('labelSizeSelect', 'Label Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'label')));
        $('#editForm').append(TemplateHandler.createSelectboxSingle('inputSizeSelect', 'Input Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'input')));
        
        // Option and values
        $('#editForm').append(TemplateHandler.createTextArea('optionsArea', inputSelector === 'input[type="radio"]' ? 'Radios' : 'Checkboxes', []));
        $('#editForm').append(TemplateHandler.createTextArea('valuesArea', inputSelector === 'input[type="radio"]' ? 'Radios Values' : 'Checkboxes Values', []));
        var radioCheckboxGroup = target.find('input').parents('label').toArray().reverse()
        var vOpt = '', vVal = '', length = radioCheckboxGroup.length;
        $.each(radioCheckboxGroup, function(i, val) {
          vOpt += $(val).text().trim();
          vVal += $(val).find('input').prop('value');
          if(i !== length - 1) {
            vOpt += '\r\n';
            vVal += '\r\n';
          }
        });
        
        $('#optionsArea').val(vOpt).prop('rows', length === 1 ? 2 : length + 1);
        $('#valuesArea').val(vVal).prop('rows', length === 1 ? 2 : length + 1);
      };
    
      return {
        init: function(target) {
          initGeneral(target);
        
          TemplateHandler.init(function() {
            RadioAndCheckboxHandler.defaultApplyCode(ComponentActionHandler.getCurrentTarget());
          });
        },
        defaultApplyCode: function(target) {
          var inputSelector = target.find('input[type="radio"]').length !== 0 ? 'input[type="radio"]' : 'input[type="checkbox"]';
          var $editForm = $('#editForm');
          var groupName = $editForm.find('#groupInput').val();
          target.find('label:first').prop('for', groupName);
          
          if($('#labelInput').val() !== '') {
            target.find('label:first').html($('#labelInput').val());
          }

          var $helpBlock = target.find('p.help-block').clone().html($('#helpblockInput').val());
          target.find('p.help-block').remove();
          
          TemplateHandler.updateSize(target.find('label:eq(0)'), $('#labelSizeSelect').val()); // label
          TemplateHandler.updateSize(target.find('label:eq(1)').parents('div[class^="col-"]').first(), $('#inputSizeSelect').val()); // input
          
          // Options and values
          target.find('div:first').html(''); // Clean
          var values = $('#valuesArea').val().split('\n'),
            cs = target.getComments(true),
            c = cs.length === 0 ? undefined : cs[0].trim().toLowerCase();
            inline = c === undefined ? true : (c.split(' ')[0] === 'inline'),
            labelClass = inline ? 'radio-inline' : 'radio'; // Default radio
            
          if(inputSelector === 'input[type="checkbox"]') { // Override if checkbox
            labelClass = inline ? 'checkbox-inline' : 'checkbox';
          }
          
          $.each($('#optionsArea').val().split('\n'), function(i, val) {
            var thisIdentifier = (groupName + '-' + i);
            var $label = $('<label class="' + labelClass  + '" for="' + thisIdentifier + '" style="cursor: pointer;"></label>');
            var v = i <= values.length - 1 ? values[i] : '';
            var $input = $('<input id="' + thisIdentifier + '" type="' + (inputSelector === 'input[type="radio"]' ? 'radio' : 'checkbox') + '" name="' + groupName + '" value="' + v + '"></input>');
            target.find('div:first').append($label.html($input).append(val)); // append to target
          });
          
          target.find('div:first').append($helpBlock); // help text
        }
      };
    }(jQuery);
    
    var InputHandler = function() {
      
      var initGeneralInputForm = function(target) {
          TemplateHandler.getEditForm(target.find('label').html()).insertAfter(target);
          var inputSelector = 'input[type="text"], input[type="password"]', typeOfInput = 'input';
          if(target.find('textarea').length !== 0) {
            inputSelector = 'textarea';
            typeOfInput = 'textarea';
          }
          
          $('#editForm').append(TemplateHandler.getInput('idInput', 'ID / Name', target.find(inputSelector).attr('id')));
          $('#editForm').append(TemplateHandler.getInput('labelInput', 'Label Text', target.find('label').html()));
          $('#editForm').append(TemplateHandler.getInput('placeholderInput', 'Placeholder', inputSelector === 'textarea' ? target.find(inputSelector).val() : target.find(inputSelector).attr('placeholder')));
          $('#editForm').append(TemplateHandler.getInput('helpblockInput', 'Help Text', target.find('p.help-block').html()));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('labelSizeSelect', 'Label Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, 'label')));
          $('#editForm').append(TemplateHandler.createSelectboxSingle('inputSizeSelect', 'Input Size', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], TemplateHandler.getSize(target, typeOfInput)));
      };
      
      var initPreAppendTextForm = function(target, prependAppend) {
        switch(prependAppend)
        {
          case 'prepend':
            $('#editForm').append(TemplateHandler.getInput('prependOrAppendInput', 'Prepend', target.find('.input-group-addon').html()));
          break;
          case 'append':
            $('#editForm').append(TemplateHandler.getInput('appendInput', 'Append', target.find('.input-group-addon').html()));
          break;
        }
      };
      
      return {
        textInput: function(target) {
        
          initGeneralInputForm(target);
          
          TemplateHandler.init(function() {
            InputHandler.defaultInputApplyCode(ComponentActionHandler.getCurrentTarget());
          });
        },
        passwordInput: function(target) {
          this.textInput(target);
        },
        defaultInputApplyCode: function(target) {
          var inputSelector = target.find('textarea').length === 0 ? 'input[type="text"], input[type="password"]' : 'textarea';
          
          var $editForm = $('#editForm');
          if($editForm.find('#idInput').val() !== '') {
            target.find(inputSelector).attr('id', $editForm.find('#idInput').val()).attr('name', $editForm.find('#idInput').val());
          }
          if($('#labelInput').val() !== '') {
            target.find('label').html($('#labelInput').val());
          }
          if($('#placeholderInput').val() !== '') {
            if(inputSelector === 'textarea') {
              target.find(inputSelector).html($('#placeholderInput').val());
            }
            else {
              target.find(inputSelector).attr('placeholder', $('#placeholderInput').val());
            }
          }
          
          target.find('p.help-block').html($('#helpblockInput').val());
          
          TemplateHandler.updateSize(target.find('label'), $('#labelSizeSelect').val()); // label
          TemplateHandler.updateSize(target.find(inputSelector).parents('div[class^="col-"]').first(), $('#inputSizeSelect').val()); // input
        },
        prependOrAppendTextInput: function(target, prependOrAppend) {
          initGeneralInputForm(target);
          TemplateHandler.getInput('prependOrAppendInput', prependOrAppend, target.find('.input-group-addon').html()).insertAfter($('#editForm #labelInput').parents('div.form-group').first());
          
          TemplateHandler.init(function() {
            var t = ComponentActionHandler.getCurrentTarget();
            InputHandler.defaultInputApplyCode(t);
            if($('#prependOrAppendInput').val() !== '') {
              t.find('.input-group-addon').html($('#prependOrAppendInput').val());
            }
          });
        },
        prependOrAppendCheckbox: function(target, prependOrAppend) {
          initGeneralInputForm(target);
          
          $('#editForm').append(TemplateHandler.createCheckboxInline('checkGroup', 'Checked', [''], ['']));
          $('#editForm').find('input[type="checkbox"]').prop('checked', target.find('input[type="checkbox"]').is(':checked'));
          
          TemplateHandler.init(function() {
            var t = ComponentActionHandler.getCurrentTarget();
            InputHandler.defaultInputApplyCode(t);
            t.find('input[type="checkbox"]').prop('checked', $('#editForm').find('input[type="checkbox"]').is(':checked'));
          });
        },
        buttonDropdown: function(target) {
          initGeneralInputForm(target);
          $('#editForm').append(TemplateHandler.createTextArea('actionOptions', 'Options', target.find('.dropdown-menu li')));

          TemplateHandler.init(function() {
            var t = ComponentActionHandler.getCurrentTarget();
            InputHandler.defaultInputApplyCode(t);
            
            // Set options
            t.find('.dropdown-menu').html('');
            $.each($('#editForm #actionOptions').val().split('\n'), function(i, val) {
              var $li = $('<li' + (val === '---' ? (' class="divider"') : '') + '></li>'), $a = $('<a href="#"></a>');
              if(!$li.hasClass('divider')) {
                $a.html(val);
                $li.html($a);
              }
              t.find('.dropdown-menu').append($li);
            });
            
          });
        },
        textArea: function(target) {
          initGeneralInputForm(target);
          
          TemplateHandler.init(function() {
            InputHandler.defaultInputApplyCode(ComponentActionHandler.getCurrentTarget());
          });
        }
      };
    }(jQuery);
    
    var OtherComponentsHandler = function() {
      return {
        legend: function(target) {
          TemplateHandler.getEditForm(target.html()).insertAfter(target);
          $('#editForm h3').append(TemplateHandler.getInput('legendInput', 'Titel', target.html()));
          TemplateHandler.init(function() {
            var t = $('#editForm #legendInput').val();
            if(t !== '') {
              $('#formVisualizer legend').html(t);
            }
          });
        }
      }
    }(jQuery);
    
    var TemplateHandler = function() {      
      return {
        init: function(func) {
          var $buttons = $('<div id="editActionSection" class="pull-right">' + '<button id="editConfirm" class="btn btn-primary">Save</button>' + '<button id="editAbort" class="btn btn-default">Cancel</button>' + '</div><div class="row"></div>');
          $('#editForm').append($buttons);
          GeneralSortableHandler.setSortableSection('#target .form-group, #editForm', false);
          ComponentActionHandler.getCurrentTarget().addClass('highLight');
          $('#editForm').find('input:first').focus();
          this.getActionFunction = func;
        },
        getEditForm: function(title) {
          var $form = $('<form id="editForm"></form>');
          var $title = $('<h3>' + ('Edit - ' + title) + '</h3>');
          $form.append($title);
          
          return $form;
        },
        getInput: function(id, title, val) {
          return $('<div class="form-group"><label class="col-sm-4 control-label" for="' + id + '">' + title + '</label><div class="col-sm-7"><input id="' + id + '" name="' + id + '" type="text" class="form-control" value="' + val + '"></div></div>');
        },
        getSize: function(target, elementOfInterest) {
          switch(elementOfInterest)
          {
            case 'button':
            case 'select':
            case 'textarea':
            case 'input':
              return target.find(elementOfInterest).parents('div[class^="col-"]').first().attr("class").match(/col-[\w-]*\b/)[0].split('-')[2];
            case 'label':
              return target.find('label').attr("class").match(/col-[\w-]*\b/)[0].split('-')[2];
            default:
              return undefined;
          }
        },
        updateSize: function(target, size) {
          target.removeClass(target.attr("class").match(/col-[\w-]*\b/)[0]).addClass('col-sm-' + size);
        },
        // Example of use: TemplateHandler.createCheckboxInline('checkboxes', 'Required', ['Yes I do', 'yes'], ['Hell no', 'no']);
        createCheckboxInline: function(groupName, label, checkBoxes, checkboxValues) {
          var $checkBoxInlineSection = $('<div class="form-group">' + '<!-- Inline checkbox -->' + '<label class="col-sm-4 control-label">' + label + '</label>' + '<div class="col-sm-7">' + '</div>' + '</div>');
            
          $.each(checkBoxes, function(i, val) {
            var checkboxInline = $('<label for="checkboxes-' + i + '" class="checkbox-inline"><input id="checkboxes-' + i + '" name="' + groupName + '" value="' + checkboxValues[i] + '" type="checkbox">' + val + '</input></label>');
            $checkBoxInlineSection.find('.col-sm-7').append(checkboxInline);
          });
            
          var $helpBlock = $('<p class="help-block"></p>');
          $checkBoxInlineSection.find('.col-sm-7').append($helpBlock);
          return $checkBoxInlineSection;
        },
        createSelectboxSingle: function(id, label, options, selected, values) {
          var $selectBoxSection = $('<div class="form-group"><!-- Select single --><label class="col-sm-4 control-label" for="' + id + '">' + label + '</label><div class="col-sm-7"></div></div>');
          var $singleSelect = $('<select id="' + id + '" name="' + id + '" class="form-control"></select>');
          var $helpBlock = $('<p class="help-block"></p>');
          
          $.each(options, function(i, val) {
            var $option = $('<option>' + val + '</option>');
            if(selected.toLowerCase() === val.toString().toLowerCase()) {
              $option.attr('selected', 'selected');
            }
            $singleSelect.append($option);
          });
    
          $selectBoxSection.find('.col-sm-7').append($singleSelect).append($helpBlock);
          return $selectBoxSection;
        },
        createTextArea: function(id, label, options, defaultText) {
          $textAreaSection = $('<div class="form-group" style="cursor: default;"><!-- Textarea --><label class="col-sm-4 control-label" for="textarea" style="cursor: default;">' + label + '</label><div class="col-sm-7"><div class="input-group"></div></div></div>');
          $textArea = $('<textarea id="' + id + '" name="' + id + '" class="form-control" cols="60" rows="' + options.length + '">' + (defaultText === undefined ? '' : defaultText) + '</textarea>');
          var v = '', length = options.length;
          $.each(options, function(i, val) {
            v += $(val).hasClass('divider') ? '---' : $(val).find('a').text();
            if(i !== length - 1) {
              v += '\r\n';
            }
          });
          
          $textArea.val(v);
          $textAreaSection.find('.input-group').append($textArea);
          return $textAreaSection;
        },
        getActionFunction: function() {
          
        }
      };
    }(jQuery);
    
    // ==== Markup ====
    var MarkupHandler = function() {
      return {
        getSource: function(cleanHtml) {
          var formSource = $('#formSource').val(); // Form only
          if(cleanHtml) {
            formSource = $('\n' + $.htmlClean(formSource, {format: true, allowComments: true, allowedAttributes: [["id"], ["style"], ["for"], ["name"], ["class"], ["type"]] } ) + '\n');
          }
          var source = formSource;
          if($('#appendFormToTemplate').is(':checked')) {
            var $page = PageBuilder.getBootstrapTemplate($('#jQueryVersionInput').val(), $('#bootstrapVersionInput').val());
            $(formSource).prependTo($page.find('body .container'));
            source = '<!DOCTYPE html>\n<html lang="en">\n' + $page.html() + '\n</html>';
          }
          
          return source;
        },
        refresh: function() {
          // Build the generated source form
          var ef = $('#formVisualizer form').clone();
          ef.find('div[style]').removeAttr('style')
          ef.find('#editForm').remove();
          ef.find('.highLight').removeClass('highLight');
          var form = $('<form class="' + ef.attr('class') + '"></form>');
          form.append($(ef).find('legend')); // Legend
          
          var divs = $('#target div.form-group');
          $.each(divs, function() {
            var groupCopy = $(this).clone();
            form.append($('<div></div>').html(groupCopy).html().trim()) // Sections
          });
          
          // Refresh markup section
          var el = $('<div></div>').html(form);
          $('#formSource').val(el.html()); // Add the markup
          l = $.htmlClean($('#formSource').val(), {format: true, allowComments: true, allowedAttributes: [["id"], ["style"], ["for"], ["name"], ["class"], ["type"]] } );
          $('#formSource').val(l);
          $('#formSource').trigger('change');
        }
      }
    }(jQuery);
    
    var PageBuilder = function() {
      
      // Refreshes the iframe preview
      var refreshPreview = function() {
        if($('#previewSection iframe').length === 0) {
          $('<iframe />', {
              name: 'previewFrame',
              id:   'previewFrame',
              width: '100%',
              frameBorder: '0'
          }).appendTo('#previewSection div:eq(0)');
        }
        
        // Set source and show the iframe
        var $frame = $('#previewSection iframe');
        var formSource = MarkupHandler.getSource(true);
        $frame.contents().find('html').html(formSource);
        $frame.height($frame.contents().find('html').height() + 20);
        
        // Form fixes
        $frame.contents().find('form').submit(function( event ) {
          event.preventDefault();
        });
      };
      return {
        init: function() {
          $('#themeSelect').change(function(e) {
            refreshPreview();
          });
          
          $('a[href="#tab5"').click(function() {
            refreshPreview();
          });
        },
        getBootstrapTemplate: function(jQueryVersion, bootstrapVersion) {
          var $dom = $('html').clone();
          $dom.removeAttr('class');
          $dom.find('body').removeAttr('screen_capture_injected');
          $dom.find('head').html('\n');
          $dom.find('body').html('\n').append('\n<!-- Body content section -->\n\n<div class="container">\n</div>\n');
          
          // Optional theme
          var optionalTheme = $('#themeSelect').val() !== '' ? ('<!-- Optional theme -->\n<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootswatch/' + bootstrapVersion + '/' + $('#themeSelect').val() + '">\n') : '\n';
          
          // Head
          $('\n<meta charset="utf-8">\n' +
            '<meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
            '<title></title>\n' +

            '<!-- Bootstrap. Latest compiled and minified CSS -->\n' +
            '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/' + bootstrapVersion + '/css/bootstrap.min.css">\n' +
            
            optionalTheme +

            '<!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->\n' +
            '<!-- WARNING: Respond.js doesnt work if you view the page via file:// -->\n' +
            '<!--[if lt IE 9]>\n' +
              '<script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>\n' +
              '<script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>\n' +
            '<![endif]-->\n')
            .each(function(i, val) {
              $dom.find('head').append(val);
            });
                
          // Body
          $('<!-- jQuery (necessary for Bootstraps JavaScript plugins) -->\n' +
            '<script src="https://ajax.googleapis.com/ajax/libs/jquery/' + jQueryVersion + '/jquery.min.js"></script>\n' +
            '<!-- Latest compiled and minified JavaScript -->\n' +
            '<script src="//netdna.bootstrapcdn.com/bootstrap/' + bootstrapVersion + '/js/bootstrap.min.js"></script>\n')
            .each(function(i, val) {
              $dom.find('body').append(val);
            });
            
          return $dom;
        }
      };
    }(jQuery);
    
    // ==== File Saver ====
    var FileSaver = function() {
      return {
        init: function() {
        
          // Save button
          $('#saveFileButton').click(function() {
            try
            {
              $('#fileErr').remove();             
              var blob = new Blob([MarkupHandler.getSource(true)], {type: "text/plain;charset=utf-8"});
              saveAs(blob, $('#saveFileInput').val());
            }
            catch(e) {
              $('<br /><div id="fileErr" class="alert alert-danger"><strong>Oh snap!</strong> The file couldn´t be saved.</div>').insertAfter($(this).parents('.input-group'));
            }
          });
          
          // Type of save change
          $('input[name="choseTypeOfSave"]').change(function() {
            $(this).val() === 'formCodeToTemplate' ? $('#pageOptionSection').show() : $('#pageOptionSection').hide();
          });
        }
      };
    }(jQuery);

    //== Public interface ==
    return {

    }
}(jQuery);