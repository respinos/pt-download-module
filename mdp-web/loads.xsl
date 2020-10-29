<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet 
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:template name="load_js_and_css">
    <xsl:call-template name="load_js"/>
    <xsl:call-template name="load_css"/>
  </xsl:template>

  <xsl:template name="load_js">
    <!-- <xsl:call-template name="load_base_js"/> -->
    <xsl:call-template name="load_coll_js"/>
    <xsl:call-template name="load_skin_js"/>
  </xsl:template>

  <xsl:template name="load_css">
    <xsl:call-template name="load_base_css"/>
    <xsl:call-template name="load_coll_css"/>
    <xsl:call-template name="load_skin_css"/>
  </xsl:template>

  <xsl:template name="load_base_js">
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/DebugUncompressed/JS ='1'">
        <xsl:call-template name="load_uncompressed_js"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="load_concat_js_file"/>
      </xsl:otherwise>
    </xsl:choose>
    <!--xsl:call-template name="load_recaptcha"/-->
  </xsl:template>

  <xsl:template name="load_recaptcha">
    <script type="text/javascript" src="https://api-secure.recaptcha.net/js/recaptcha_ajax.js"></script>
  </xsl:template>

  <xsl:template name="load_base_css">
    <xsl:choose>
      <!--when global or local.conf debug_uncompressed_css = 1 load uncompressed css-->
      <xsl:when test="(/MBooksTop/MBooksGlobals/DebugUncompressed/CSS ='1') ">
        <xsl:call-template name="load_uncompressed_css"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="load_concat_css_file"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>


</xsl:stylesheet>
