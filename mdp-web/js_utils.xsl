<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                version="1.0">



  <xsl:template name="include_local_javascript">
    <!-- Below is a workaround for javascript script tags so we don't get a cdata output in older versions of libxslt using xhtml            -->
    <!--     WARNING  This won't work if the javascript in the XML has a > or < sign in them          -->

    <xsl:text>&#xA;</xsl:text>
    <xsl:comment>include_local_javascript: common javascript</xsl:comment>
    <xsl:text>&#xA;</xsl:text>

    <xsl:text disable-output-escaping="yes">&lt;script type="text/javascript"&gt;</xsl:text>
    <xsl:value-of select="/MBooksTop/CollectionsOwnedJs"/>
    <xsl:text disable-output-escaping="yes"> &lt;/script&gt;</xsl:text>

    <xsl:text disable-output-escaping="yes">&lt;script type="text/javascript"&gt;</xsl:text>
    <xsl:value-of select="/MBooksTop/CollectionSizesJs"/>
    <xsl:text disable-output-escaping="yes"> &lt;/script&gt;</xsl:text>

    <xsl:text disable-output-escaping="yes">&lt;script type="text/javascript"&gt;</xsl:text>
    <xsl:value-of select="/MBooksTop/MBooksGlobals/LoggedInJs"/>
    <xsl:text disable-output-escaping="yes"> &lt;/script&gt;</xsl:text>

  </xsl:template>


  <xsl:template name="debug_CSS">
    <!-- overide debug style if debug flag is on -->
    <!--XXX should there be some template here in the head for globals-->
    <xsl:variable name="debug_flag">
      <xsl:value-of select="/MBooksTop/MBooksGlobals/Debug"/>
    </xsl:variable>
    <xsl:if test = "$debug_flag = 'YES'">
      <style type="text/css">
        <xsl:text>
          .debug {
          display:inline;
          color: red;
          font-size: 14pt;
          visibility:visible;
          }
          
          /*** This one is placed before the " Search results in Foo Collection" **/
          .IndexMsgSearchResults
          { 
          color:green;
          font-size: .75em;
          position: relative;
          display: inline;
          visiblility:visible;
          
          } 
          /*** this one is right by the search box in list items or list search
          results ***/

          .IndexMsgSearchWidget
          { 
          color:red;
          float: left;
          font-size: .75em;
          position: relative;
          padding-right: 5px;
          display: inline;
          visiblility:visible;
          } 
          
        </xsl:text>
      </style>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>
