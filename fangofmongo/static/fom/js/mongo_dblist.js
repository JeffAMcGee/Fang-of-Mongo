function fom_init_db_list() {
  Fom_db_list = $.extend({}, $.ui.fom_object.prototype, {
    _init: function(){
      $.ui.fom_plugin.prototype._init.call(this); // call the original function
      var this_obj = this;
      $('#mongo_ui_header_tools_bus').fom_bus('add_listener', this );
      $('#mongo_ui_container').append("<div id='mongo_ui_database_list'></div>");
      $('#mongo_ui_database_list').fom_ui_list({
        'title':'Databases',
        'div_id': 'mongo_ui_database_list',
        'position':['left', 100],
        active: this.options.active,
      });
      $('#mongo_ui_database_list').bind('search', function(e, query){ this_obj.search(query); });
      $('#mongo_ui_database_list').bind('fom_item_selected', function(e, dbname){
        this_obj.options['database'] = dbname;
        $('#mongo_ui_header_tools_bus').fom_bus('signal', 'database_selected', this_obj, {'database': dbname } );
      });
      $('#mongo_ui_database_list').bind('close', function(){
        $('#mongo_ui_database_list_menu_btn').attr('checked',false);
        $('#mongo_ui_database_list_menu_btn').button('refresh');
      });
      $('#mongo_ui_database_list').fom_ui_list('get_ui_element', 'search_input').focus(function() {
        $('#mongo_ui_header_tools_bus').fom_bus('signal', 'help_needed', this_obj, { book:'fom_db_list', topic:'search_db_list'  } );
      });
      //menu button
      $('#mongo_ui_menu').append('<input type="checkbox" id="mongo_ui_database_list_menu_btn" checked="checked"/><label for="mongo_ui_database_list_menu_btn">Show dbs</label>');
      $('#mongo_ui_database_list_menu_btn').button();
      var dialog_id = '#' + $('#mongo_ui_database_list').fom_ui_list('option','div_id')+'_dialog';
      $('#mongo_ui_database_list_menu_btn').click(function () { $(dialog_id).dialog('isOpen')? $(dialog_id).dialog('close') : $(dialog_id).dialog('open'); $('#mongo_ui_database_list_menu_btn').val(false); });
      $('#mongo_ui_database_list').fom_ui_list('get_ui_element','toolbox')
        .html(
          $('<button>+</button>').addClass('fom_ui_list_toolbox_btn').addClass('new_db').click(function(){
            //new database
            $('<div />').html(
              $('<span>New database name:</span>')
              .add(
                $('<input type="text"/>').keyup(function(event){
                  if (event.keyCode == 13) {
                    $(this).parent().dialog('widget').find('button').first().trigger('click');
                  }
                })
              )
            )
            .dialog({
              autoOpen: true,
              height: 150,
              width: 350,
              modal: true,
              closeOnEscape: true,
              title: 'Create database',
              buttons: {
                'Create': function(){
                  //create new database
                  dbname = $(this).find('input').val().trim();
                  if (dbname == '') {
                     alert('You have to type a name for new database');
                     return;
                  };
                  $('#mongo_ajax').fom_object_mongo_ajax('operation', {
                    operation:   'create_database',
                    subject:    'server',
                    database_name: dbname,
                    context: this_obj,
                    callback: function(data){
                      if ( 'error' in data ) { alert('error: ' + data['error']); return; }
                      $('#mongo_ui_database_list').fom_ui_list('get_ui_element', 'search_btn').click();
                    },
                  });
                  $(this).dialog('close');
                },
                'Cancel': function(){
                  $(this).dialog('close');
                },
              },
            })
            .find('input')
            .focus()

          })
          .add($('<button>-</button>').addClass('fom_ui_list_toolbox_btn').addClass('del_db').click(function(){
            //remove database
            if (!$('#mongo_ui_database_list').fom_ui_list('has_selected')) {
              alert('There is no database selected.');
              return;
            }
            $('<div />').html(
              $('<span>Are you sure you want to drop database ' + this_obj.options['database'] + '?</span>')
            )
            .dialog({
              autoOpen: true,
              height: 150,
              width: 350,
              modal: true,
              closeOnEscape: true,
              title: 'Drop database',
              buttons: {
                'Drop': function(){
                  //drop database
                  $('#mongo_ajax').fom_object_mongo_ajax('operation', {
                    operation:   'drop_database',
                    subject:    'server',
                    database_name: ''+this_obj.options['database'], //HACK: without ''+ hack, jquery sends dbname as array (database_name[0]: first letter of name - and so on)
                    context: this_obj,
                    callback: function(data){
                      if ( 'error' in data ) { alert('error: ' + data['error']); return; }
                      $('#mongo_ui_database_list').fom_ui_list('get_ui_element', 'search_btn').click();
                    },

                  });
                  $(this).dialog('close');
                },
                'Cancel': function(){
                  $(this).dialog('close');
                },
              },

            });

          }))
        );

    },

     signal: function(signal_name, signal_source, signal_data ) {
      if (signal_name == 'app_init')
      {
        $('#mongo_ajax').fom_object_mongo_ajax('get_db_list','','');
      }
      if ( signal_name == 'database_list_received')
      {
        $('#mongo_ui_database_list').fom_ui_list('set_list', signal_data['data'], signal_data['search'], signal_data['method']);
      }
     },
     search: function(query){
       var this_obj = this;
       $('#mongo_ajax').fom_object_mongo_ajax('get_db_list',query,'');
       this.options['database'] = null;
       $('#mongo_ui_header_tools_bus').fom_bus('signal', 'no_database_selected', this_obj, {} );
     },

  });

  $.widget("ui.fom_plugin_db", Fom_db_list);

  //init db list
  $('#mongo_ui_header_tools').after('<span id="mongo_ui_header_tools_db"></span>');
  $(window).load( function() { $('#mongo_ui_header_tools_db').fom_plugin_db({'active':true}); });
  //end of database list
}
