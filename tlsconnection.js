/*
 * Copyright (c) 2012 Adam Jabłoński
 *
 * Gmail Notify Extension is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 2 of the License, or (at your
 * option) any later version.
 *
 * Gmail Notify Extension is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License
 * for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with Gnome Documents; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * Author: Adam Jabłoński <jablona123@gmail.com>
 *
 */
try {
	const Gio = imports.gi.Gio;
}
catch (err) {
	global.log("Soup import error:"+err.message);
}
const Lang = imports.lang;
const Signals = imports.signals;
const _DEBUG=false;

function Connection (host,port,usetls) {
	this._init(host,port,usetls);
}
Connection.prototype = {

	_init : function (host,port,usetls) {
		try 
		{
			if (_DEBUG) global.log("Conection _init "+host);
			this.resolver=Gio.Resolver.get_default();
			this.newline = String.fromCharCode(10);
			this.connected=false;
			this.host=host;
			this.port=port;
			this.tls=usetls;
			this._connection=null;
			this.inputBuffer=null;
			this.outputBuffer=null;
			if (_DEBUG) global.log("Conection post _init "+host);
		}
		catch (err) {
			global.log(err.message);
		}
	},
	_disconnect : function () {
		if (this._connection!=null) {
			let result=this._connection.socket.close();
			this.connected=false;
			this.emit('disconnected',result);
		}
	},
	_connect : function ( callback )
		{
			this.resolver.lookup_by_name_async(this.host,null,
			Lang.bind(this,function (res,aResult,aData) {
				try {
					let address_list = this.resolver.lookup_by_name_finish(aResult);
						if (typeof(address_list)!='undefined') {
							if ( address_list.length > 0) {
							this.emit('resolved',address_list);
							if (_DEBUG) global.log(address_list[0].to_string());
							if (_DEBUG) global.log('host '+this.host);
							if (_DEBUG) global.log('port '+this.port);
								let inet_addr=Gio.InetAddress.new_from_string(address_list[0].to_string());
								let isock_adr=Gio.InetSocketAddress.new( inet_addr, this.port);
								let net_adr=Gio.NetworkAddress.new(this.host,this.port);
								let client = new Gio.SocketClient();
								if (this.tls) {
									client.tls=true;
									client.tls_validation_flags=0;
								}
								client.connect_async(isock_adr,null, Lang.bind(this,function(aClient,aRes,uData)
									{
										try
										{

											this._connection=aClient.connect_finish(aRes);
											if ( this._connection != null )
											{
												this.inputStream=Gio.DataInputStream.new(this._connection.get_input_stream());
												this.outputStream=Gio.DataOutputStream.new(this._connection.get_output_stream());
												this.inputStream.set_buffer_size(32768);
												let newLineType=this.inputStream.get_newline_type();
												switch(newLineType)
												{
													case Gio.DataStreamNewlineType.LF :
														this.newline = String.fromCharCode(10);
														if (_DEBUG) global.log("New Line is LF");
														break;
													case Gio.DataStreamNewlineType.CR_LF :
														this.newline = String.fromCharCode(13)+String.fromCharCode(10);
														if (_DEBUG) global.log("New Line is CRLF");
														break;
													case Gio.DataStreamNewlineType.CR :
														this.newline = String.fromCharCode(13);
														if (_DEBUG) global.log("New Line is CR");
														break;
													case Gio.DataStreamNewlineType.ANY :
														this.newline = String.fromCharCode(10);
														if (_DEBUG) global.log("New Line is ANY");
														break;
												}
												this.connected=true;
												this.emit('connected',this);
												if (typeof(callback) !=	'undefined') {
														callback.apply(this,[this,true]);
												}

											}
											else
											{
												this.emit('error','Connection: Cannot connect');
												if (typeof(callback) !=	'undefined') {
														callback.apply(this,[this,false, new Error('Connection: Cannot connect')]);
												}
											}
										}
										catch (err)
										{
											this.emit('error',err.message);
											if (typeof(callback) !=	'undefined') {
														callback.apply(this,[this,false,err]);
											}
										}
									}),null)
							}
			}
			else
			{
				this.emit('error','Connection: Cannot resolve hostname');
				if (typeof(callback) !=	'undefined') {
						callback.apply(this,[this,false, new Error('Connection: Cannot resolve hostname')]);
				}
			}
		}
		catch (err) {
			global.log("_connect:"+err.message);
			this.emit('error',err.message);
			if (typeof(callback) !=	'undefined') {
				callback.apply(this,[this,false,err]);
			}
		}
		}),null);
	}
};

Signals.addSignalMethods(Connection.prototype);

function TlsConnection () {
	this._init.apply(this,arguments);
}
TlsConnection.prototype= {
	__proto__ : Connection.prototype,
	_init : function (host,port) {
		if (_DEBUG) global.log("TlsConection _init "+host);
		Connection.prototype._init.call(this,host,port,true);
	}
}
